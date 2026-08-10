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
    let affiliateRef = typeof body.affiliate_ref === "string" ? body.affiliate_ref : null;
    const couponRaw = typeof body.coupon_code === "string" ? body.coupon_code.trim().toUpperCase() : "";

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let discountPercent = 0;
    let couponCode: string | null = null;
    if (couponRaw) {
      const { data: coupon } = await admin
        .from("coupons")
        .select("code, discount_percent, affiliate_code, active, max_redemptions, redemptions")
        .eq("code", couponRaw)
        .maybeSingle();
      if (!coupon || !coupon.active) {
        return new Response(JSON.stringify({ error: "invalid_coupon" }), {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      if (coupon.max_redemptions != null && coupon.redemptions >= coupon.max_redemptions) {
        return new Response(JSON.stringify({ error: "coupon_exhausted" }), {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      discountPercent = coupon.discount_percent;
      couponCode = coupon.code;
      if (!affiliateRef && coupon.affiliate_code) affiliateRef = coupon.affiliate_code;
    }

    const amount = Math.max(
      1,
      Math.round(cfg.amount * (1 - discountPercent / 100) * 100) / 100,
    );

    const formData = { ...(body.formData ?? body) };
    delete formData.plano;
    delete formData.utm;
    delete formData.affiliate_ref;
    delete formData.coupon_code;

    const notificationUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`;
    const paymentBody = {
      ...formData,
      transaction_amount: amount,
      description: `Jogador PRO — ${cfg.nome}${couponCode ? ` (${couponCode})` : ""}`,
      external_reference: user.id,
      metadata: {
        supabase_user_id: user.id,
        plano,
        utm_source: utm.utm_source ?? null,
        utm_campaign: utm.utm_campaign ?? null,
        affiliate_ref: affiliateRef,
        coupon_code: couponCode,
        discount_percent: discountPercent || null,
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
        coupon_code: couponCode,
        discount_percent: discountPercent || null,
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
          paused_until: null,
          pause_reason: null,
        })
        .eq("id", user.id);

      if (couponCode) {
        const { data: c } = await admin.from("coupons").select("redemptions").eq("code", couponCode).maybeSingle();
        await admin
          .from("coupons")
          .update({ redemptions: (c?.redemptions ?? 0) + 1 })
          .eq("code", couponCode);
      }

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
                  value: amount,
                  content_name: plano,
                  utm_source: utm.utm_source,
                  utm_campaign: utm.utm_campaign,
                  coupon: couponCode,
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
        amount,
        coupon_code: couponCode,
        discount_percent: discountPercent || null,
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
