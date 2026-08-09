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
      await admin
        .from("profiles")
        .update({
          assinante: true,
          plano,
          mp_payment_id: String(payment.id),
          mp_payer_id: payment.payer?.id ? String(payment.payer.id) : null,
        })
        .eq("id", userId);
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
