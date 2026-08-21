import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { jsonResponse, optionsResponse } from "../_shared/cors.ts";
import { createAdminClient, requireUser } from "../_shared/auth.ts";
import { extenderAcesso } from "../_shared/acesso.ts";
import { sendCapi, hashIdentifier, hashPhoneBr, pickClientIpFromRequest, aplicarNomeUserData, aplicarCountryBr } from "../_shared/capi.ts";
import {
  PLANOS,
  pickMpPaymentFields,
  buildIdempotencyKey,
  paymentBelongsToUser,
} from "../_shared/mp.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) {
      return jsonResponse({ error: "MERCADOPAGO_ACCESS_TOKEN not configured" }, 500);
    }

    const auth = await requireUser(req);
    if (auth instanceof Response) return auth;
    const { user } = auth;

    const body = await req.json();
    const plano = String(body.plano ?? "semestral");
    const cfg = PLANOS[plano];
    if (!cfg) return jsonResponse({ error: "invalid_plano" }, 400);

    const utm = (body.utm ?? {}) as Record<string, string | undefined>;
    let affiliateRef = typeof body.affiliate_ref === "string" ? body.affiliate_ref : null;
    const couponRaw = typeof body.coupon_code === "string" ? body.coupon_code.trim().toUpperCase() : "";

    const admin = createAdminClient();

    let discountPercent = 0;
    let couponCode: string | null = null;
    if (couponRaw) {
      const { data: coupon } = await admin
        .from("coupons")
        .select("code, discount_percent, affiliate_code, active, max_redemptions, redemptions")
        .eq("code", couponRaw)
        .maybeSingle();
      if (!coupon || !coupon.active) return jsonResponse({ error: "invalid_coupon" }, 400);
      if (coupon.max_redemptions != null && coupon.redemptions >= coupon.max_redemptions) {
        return jsonResponse({ error: "coupon_exhausted" }, 400);
      }
      discountPercent = coupon.discount_percent;
      couponCode = coupon.code;
      if (!affiliateRef && coupon.affiliate_code) affiliateRef = coupon.affiliate_code;
    }

    const amount = Math.max(1, Math.round(cfg.amount * (1 - discountPercent / 100) * 100) / 100);

    const rawForm =
      body.formData && typeof body.formData === "object"
        ? (body.formData as Record<string, unknown>)
        : (body as Record<string, unknown>);
    const formData = pickMpPaymentFields(rawForm);

    const metaAttr = (body.meta ?? {}) as Record<string, string | undefined>;
    const clientUa = metaAttr.client_user_agent ?? req.headers.get("user-agent") ?? undefined;
    const clientIp = pickClientIpFromRequest(req, metaAttr.client_ip);
    const checkoutTime = Number(metaAttr.checkout_time) || Math.floor(Date.now() / 1000);

    const { data: perfilAntes } = await admin
      .from("profiles")
      .select("assinante, assinante_until, cpf, phone, nome")
      .eq("id", user.id)
      .maybeSingle();
    const segmentation = perfilAntes?.assinante
      ? "existing_customer_to_business"
      : "new_customer_to_business";

    const notificationUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`;
    const isPix = String(formData.payment_method_id ?? "").toLowerCase() === "pix";
    const payer = (formData.payer ?? {}) as Record<string, unknown>;
    if (!payer.email) payer.email = user.email;
    const ident = (payer.identification ?? {}) as Record<string, unknown>;
    const cpfFromBrick = typeof ident.number === "string" ? ident.number : "";
    const cpf = cpfFromBrick.length === 11 ? cpfFromBrick : perfilAntes?.cpf ?? null;
    if (cpf) payer.identification = { type: "CPF", number: cpf };
    formData.payer = payer;

    const paymentBody: Record<string, unknown> = {
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
        meta_fbp: metaAttr.fbp ?? null,
        meta_fbc: metaAttr.fbc ?? null,
        meta_event_source_url: metaAttr.event_source_url ?? null,
        meta_client_user_agent: clientUa ?? null,
        meta_client_ip: clientIp ?? null,
        meta_referrer_url: metaAttr.referrer_url ?? null,
        meta_checkout_time: checkoutTime,
        meta_segmentation: segmentation,
      },
      notification_url: notificationUrl,
      payer,
    };
    if (isPix) {
      paymentBody.date_of_expiration = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    }

    const clientKey = typeof body.idempotency_key === "string" ? body.idempotency_key : "";
    const janela = Math.floor(Date.now() / 120_000);
    const idempotencyKey = await buildIdempotencyKey(
      user.id,
      clientKey,
      `${plano}|${amount}|${couponCode ?? ""}|${janela}`,
    );

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
      return jsonResponse({ error: payment.message ?? "payment_failed" }, 400);
    }

    if (!paymentBelongsToUser(payment as Record<string, unknown>, user.id)) {
      console.error("MP payment user mismatch", payment.id, payment.external_reference);
      return jsonResponse({ error: "payment_mismatch" }, 403);
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
          assinante_until: extenderAcesso(perfilAntes?.assinante_until, plano),
          mp_payment_id: String(payment.id),
          mp_payer_id: payment.payer?.id ? String(payment.payer.id) : null,
          referred_by: affiliateRef,
          paused_until: null,
          pause_reason: null,
          pause_used_at: null,
          cancelled_at: null,
          cancel_reason: null,
        })
        .eq("id", user.id);

      await admin
        .from("checkout_intents")
        .update({ purchased_at: new Date().toISOString(), plano })
        .eq("user_id", user.id);

      if (couponCode) {
        const { data: redeemed } = await admin.rpc("redeem_coupon", { p_code: couponCode });
        if (redeemed === false) console.error("coupon race", couponCode);
      }

      const email = (user.email ?? "").toLowerCase().trim();
      const userData: Record<string, unknown> = {
        external_id: [await hashIdentifier(user.id)],
        subscription_id: String(payment.id),
      };
      if (email) userData.em = [await hashIdentifier(email)];
      const ph = await hashPhoneBr(perfilAntes?.phone);
      if (ph) userData.ph = [ph];
      await aplicarNomeUserData(userData, perfilAntes?.nome);
      await aplicarCountryBr(userData);
      if (metaAttr.fbp) userData.fbp = metaAttr.fbp;
      if (metaAttr.fbc) userData.fbc = metaAttr.fbc;
      if (clientUa) userData.client_user_agent = clientUa;
      if (clientIp) userData.client_ip_address = clientIp;

      void sendCapi({
        eventName: "Purchase",
        eventId: `mp-${payment.id}`,
        eventTime: Math.floor(new Date(payment.date_approved ?? Date.now()).getTime() / 1000),
        eventSourceUrl: metaAttr.event_source_url,
        referrerUrl: metaAttr.referrer_url,
        customerSegmentation: segmentation,
        userData,
        customData: {
          currency: "BRL",
          value: amount,
          content_name: plano,
          utm_source: utm.utm_source,
          utm_campaign: utm.utm_campaign,
          coupon: couponCode,
        },
      });
    }

    const tx = payment.point_of_interaction?.transaction_data as
      | { qr_code?: string; qr_code_base64?: string; ticket_url?: string }
      | undefined;

    return jsonResponse({
      id: payment.id,
      status: payment.status,
      status_detail: payment.status_detail,
      plano,
      amount,
      coupon_code: couponCode,
      discount_percent: discountPercent || null,
      payment_method_id: payment.payment_method_id ?? formData.payment_method_id ?? null,
      qr_code: tx?.qr_code ?? null,
      qr_code_base64: tx?.qr_code_base64 ?? null,
      ticket_url: tx?.ticket_url ?? null,
    });
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: error instanceof Error ? error.message : "error" }, 500);
  }
});
