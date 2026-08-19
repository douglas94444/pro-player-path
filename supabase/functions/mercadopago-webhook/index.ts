import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createAdminClient, resolveSecret } from "../_shared/auth.ts";
import { extenderAcesso } from "../_shared/acesso.ts";
import { sendCapi, hashIdentifier } from "../_shared/capi.ts";
import { verifyMpWebhookSignature } from "../_shared/mp.ts";

Deno.serve(async (req) => {
  const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
  if (!accessToken) return new Response("Mercado Pago not configured", { status: 500 });

  const secret = await resolveSecret("MERCADOPAGO_WEBHOOK_SECRET", "mercadopago_webhook_secret");
  const url = new URL(req.url);
  let paymentId = url.searchParams.get("data.id") ?? url.searchParams.get("id");

  let body: Record<string, unknown> = {};
  if (req.method === "POST") {
    body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const data = body["data"] as { id?: string | number } | undefined;
    if (data?.id) paymentId = String(data.id);
    else if (body["id"]) paymentId = String(body["id"]);
  }

  const signed = await verifyMpWebhookSignature({
    xSignature: req.headers.get("x-signature"),
    xRequestId: req.headers.get("x-request-id"),
    dataId: paymentId ?? "",
    secret,
  });
  if (!signed) {
    return new Response(JSON.stringify({ error: "invalid_signature" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const admin = createAdminClient();

  try {
    const topic = url.searchParams.get("type") ?? url.searchParams.get("topic");
    const bodyType = typeof body["type"] === "string" ? String(body["type"]) : "";
    const effectiveTopic = topic || bodyType;

    if (!paymentId || (effectiveTopic && effectiveTopic !== "payment" && effectiveTopic !== "payment.updated")) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const payment = await mpRes.json();
    if (!mpRes.ok) {
      console.error("MP fetch payment failed", payment);
      return new Response("payment fetch failed", { status: 400 });
    }

    const userId =
      (payment.metadata?.supabase_user_id as string | undefined) ??
      (payment.external_reference as string | undefined) ??
      null;
    const plano = (payment.metadata?.plano as string | undefined) ?? "semestral";
    const approved = payment.status === "approved";

    await admin.from("payment_events").upsert(
      {
        user_id: userId,
        stripe_event_id: `mp-${payment.id}-${payment.status}`,
        event_type: `payment.${payment.status}`,
        plano,
        payload: payment,
      },
      { onConflict: "stripe_event_id" },
    );

    if (userId && approved) {
      const { data: perfilAntes } = await admin
        .from("profiles")
        .select("assinante, assinante_until, mp_payment_id")
        .eq("id", userId)
        .maybeSingle();

      const mesmoPagamento = perfilAntes?.mp_payment_id === String(payment.id);
      await admin
        .from("profiles")
        .update({
          assinante: true,
          plano,
          ...(mesmoPagamento ? {} : { assinante_until: extenderAcesso(perfilAntes?.assinante_until, plano) }),
          mp_payment_id: String(payment.id),
          mp_payer_id: payment.payer?.id ? String(payment.payer.id) : null,
          paused_until: null,
          pause_reason: null,
          pause_used_at: null,
          cancelled_at: null,
          cancel_reason: null,
        })
        .eq("id", userId);

      await admin
        .from("checkout_intents")
        .update({ purchased_at: new Date().toISOString(), plano })
        .eq("user_id", userId);

      const capiToken = Deno.env.get("META_CAPI_ACCESS_TOKEN");
      if (capiToken) {
        const md = (payment.metadata ?? {}) as Record<string, string | number | null>;
        const email = String(payment.payer?.email ?? "").toLowerCase().trim();
        const userData: Record<string, unknown> = { external_id: [await hashIdentifier(userId)] };
        if (email) userData.em = [await hashIdentifier(email)];
        if (md.meta_fbp) userData.fbp = md.meta_fbp;
        if (md.meta_fbc) userData.fbc = md.meta_fbc;
        if (md.meta_client_user_agent) userData.client_user_agent = md.meta_client_user_agent;

        const agora = Math.floor(Date.now() / 1000);
        const limite = agora - 7 * 24 * 3600;
        const aprovado = payment.date_approved
          ? Math.floor(new Date(payment.date_approved).getTime() / 1000)
          : agora;
        const eventTime = aprovado > limite && aprovado <= agora + 60 ? aprovado : agora;
        const checkoutTime = Number(md.meta_checkout_time);
        const segmentation =
          (md.meta_segmentation as string | null) ??
          (perfilAntes?.assinante ? "existing_customer_to_business" : "new_customer_to_business");

        await sendCapi({
          eventName: "Purchase",
          eventId: `mp-${payment.id}`,
          eventTime,
          eventSourceUrl: typeof md.meta_event_source_url === "string" ? md.meta_event_source_url : undefined,
          originalEventData:
            Number.isFinite(checkoutTime) && checkoutTime > limite
              ? { event_name: "InitiateCheckout", event_time: checkoutTime }
              : undefined,
          userData,
          customData: {
            currency: "BRL",
            value: Number(payment.transaction_amount ?? 0),
            content_name: plano,
            coupon: md.coupon_code ?? undefined,
            utm_source: md.utm_source ?? undefined,
            utm_campaign: md.utm_campaign ?? undefined,
            customer_segmentation: segmentation,
          },
        });
      }
    }

    if (
      userId &&
      (payment.status === "cancelled" || payment.status === "refunded" || payment.status === "charged_back")
    ) {
      await admin
        .from("profiles")
        .update({ assinante: false, plano: null, assinante_until: null })
        .eq("id", userId)
        .eq("mp_payment_id", String(payment.id));
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response("webhook failed", { status: 500 });
  }
});
