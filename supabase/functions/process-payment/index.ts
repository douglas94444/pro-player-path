import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLANOS: Record<string, { nome: string; amount: number }> = {
  mensal: { nome: "Mensal", amount: 47 },
  semestral: { nome: "Semestral", amount: 147 },
  anual: { nome: "Anual", amount: 197 },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "MERCADOPAGO_ACCESS_TOKEN not configured" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const plano = String(body.plano ?? "semestral");
    const cfg = PLANOS[plano];
    if (!cfg) {
      return new Response(JSON.stringify({ error: "invalid_plano" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Nunca confiar no amount do frontend
    const formData = { ...(body.formData ?? body) };
    delete formData.plano;

    const notificationUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`;
    const paymentBody = {
      ...formData,
      transaction_amount: cfg.amount,
      description: `Jogador PRO — ${cfg.nome}`,
      external_reference: user.id,
      metadata: {
        supabase_user_id: user.id,
        plano,
      },
      notification_url: notificationUrl,
      payer: {
        ...(formData.payer ?? {}),
        email: formData.payer?.email ?? user.email,
      },
    };

    const idempotencyKey = crypto.randomUUID();
    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(paymentBody),
    });

    const payment = await mpRes.json();
    if (!mpRes.ok) {
      console.error("MP payment error", payment);
      return new Response(JSON.stringify({ error: payment.message ?? "payment_failed", details: payment }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    await admin.from("payment_events").upsert(
      {
        user_id: user.id,
        stripe_event_id: `mp-${payment.id}`,
        event_type: `payment.${payment.status}`,
        plano,
        payload: payment,
      },
      { onConflict: "stripe_event_id" },
    );

    if (payment.status === "approved") {
      await admin
        .from("profiles")
        .update({
          assinante: true,
          plano,
          mp_payment_id: String(payment.id),
          mp_payer_id: payment.payer?.id ? String(payment.payer.id) : null,
        })
        .eq("id", user.id);
    }

    return new Response(
      JSON.stringify({
        id: payment.id,
        status: payment.status,
        status_detail: payment.status_detail,
        plano,
      }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "error" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
