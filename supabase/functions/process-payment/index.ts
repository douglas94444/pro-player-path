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

    const utm = (body.utm ?? {}) as Record<string, string | undefined>;
    const affiliateRef = typeof body.affiliate_ref === "string" ? body.affiliate_ref : null;

    const formData = { ...(body.formData ?? body) };
    delete formData.plano;
    delete formData.utm;
    delete formData.affiliate_ref;

    const notificationUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`;
    const paymentBody = {
      ...formData,
      transaction_amount: cfg.amount,
      description: `Jogador PRO — ${cfg.nome}`,
      external_reference: user.id,
      metadata: {
        supabase_user_id: user.id,
        plano,
        utm_source: utm.utm_source ?? null,
        utm_campaign: utm.utm_campaign ?? null,
        affiliate_ref: affiliateRef,
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
        utm_source: utm.utm_source ?? null,
        utm_medium: utm.utm_medium ?? null,
        utm_campaign: utm.utm_campaign ?? null,
        utm_content: utm.utm_content ?? null,
        utm_term: utm.utm_term ?? null,
        affiliate_ref: affiliateRef,
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
          referred_by: affiliateRef,
        })
        .eq("id", user.id);

      // Meta CAPI (não bloqueia resposta)
      const capiToken = Deno.env.get("META_CAPI_ACCESS_TOKEN");
      if (capiToken) {
        const pixelId = Deno.env.get("META_PIXEL_ID") ?? "3161156880941929";
        const email = (user.email ?? "").toLowerCase().trim();
        let em: string | undefined;
        if (email) {
          const enc = new TextEncoder();
          const hash = await crypto.subtle.digest("SHA-256", enc.encode(email));
          em = Array.from(new Uint8Array(hash))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
        }
        void fetch(`https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${capiToken}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: [
              {
                event_name: "Purchase",
                event_time: Math.floor(Date.now() / 1000),
                event_id: `mp-${payment.id}`,
                action_source: "website",
                user_data: em ? { em: [em] } : {},
                custom_data: {
                  currency: "BRL",
                  value: cfg.amount,
                  content_name: plano,
                  utm_source: utm.utm_source,
                  utm_campaign: utm.utm_campaign,
                },
              },
            ],
          }),
        }).catch(console.error);
      }
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
