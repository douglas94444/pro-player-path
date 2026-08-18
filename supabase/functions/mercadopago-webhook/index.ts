import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

Deno.serve(async (req) => {
  const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
  if (!accessToken) return new Response("Mercado Pago not configured", { status: 500 });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const url = new URL(req.url);
    let paymentId = url.searchParams.get("data.id") ?? url.searchParams.get("id");
    const topic = url.searchParams.get("type") ?? url.searchParams.get("topic");

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({} as Record<string, unknown>));
      const data = body["data"] as { id?: string | number } | undefined;
      if (data?.id) paymentId = String(data.id);
      else if (body["id"]) paymentId = String(body["id"]);
    }

    if (!paymentId || (topic && topic !== "payment" && topic !== "payment.updated")) {
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
        .select("assinante")
        .eq("id", userId)
        .maybeSingle();

      await admin
        .from("profiles")
        .update({
          assinante: true,
          plano,
          mp_payment_id: String(payment.id),
          mp_payer_id: payment.payer?.id ? String(payment.payer.id) : null,
        })
        .eq("id", userId);

      // Purchase server-side com os identificadores capturados no checkout.
      const capiToken = Deno.env.get("META_CAPI_ACCESS_TOKEN");
      if (capiToken) {
        const pixelId = Deno.env.get("META_PIXEL_ID") ?? "3161156880941929";
        const sha256 = async (v: string) => {
          const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v));
          return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
        };
        const md = (payment.metadata ?? {}) as Record<string, string | number | null>;
        const email = String(payment.payer?.email ?? "").toLowerCase().trim();
        const userData: Record<string, unknown> = { external_id: [await sha256(userId)] };
        if (email) userData.em = [await sha256(email)];
        if (md.meta_fbp) userData.fbp = md.meta_fbp;
        if (md.meta_fbc) userData.fbc = md.meta_fbc;
        if (md.meta_client_user_agent) userData.client_user_agent = md.meta_client_user_agent;
        const testEventCode = Deno.env.get("META_TEST_EVENT_CODE");

        // Pix confirma depois: usamos a hora real da aprovação e,
        // como o evento é "atrasado", apontamos para o checkout original.
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

        await fetch(`https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${capiToken}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: [
              {
                event_name: "Purchase",
                event_time: eventTime,
                // mesmo event_id do pixel/checkout → o Meta deduplica
                event_id: `mp-${payment.id}`,
                action_source: "website",
                event_source_url: md.meta_event_source_url ?? undefined,
                data_processing_options: [],
                ...(Number.isFinite(checkoutTime) && checkoutTime > limite
                  ? {
                      original_event_data: {
                        event_name: "InitiateCheckout",
                        event_time: checkoutTime,
                      },
                    }
                  : {}),
                user_data: userData,
                custom_data: {
                  currency: "BRL",
                  value: Number(payment.transaction_amount ?? 0),
                  content_name: plano,
                  coupon: md.coupon_code ?? undefined,
                  utm_source: md.utm_source ?? undefined,
                  utm_campaign: md.utm_campaign ?? undefined,
                  customer_segmentation: segmentation,
                },
              },
            ],
            ...(testEventCode ? { test_event_code: testEventCode } : {}),
          }),
        }).catch(console.error);
      }
    }



    if (userId && (payment.status === "cancelled" || payment.status === "refunded" || payment.status === "charged_back")) {
      await admin
        .from("profiles")
        .update({ assinante: false, plano: null })
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
