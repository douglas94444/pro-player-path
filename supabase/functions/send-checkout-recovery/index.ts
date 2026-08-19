import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { requireCronSecret, createAdminClient } from "../_shared/auth.ts";
import { jsonResponse } from "../_shared/cors.ts";
import { sendResendEmail, appUrl, escapeHtml } from "../_shared/email.ts";

const PLANOS_OK = new Set(["mensal", "semestral", "anual"]);

/**
 * Recovery de checkout abandonado (45 min–24 h).
 * Auth: Authorization Bearer CRON_SECRET
 */
Deno.serve(async (req) => {
  const denied = await requireCronSecret(req);
  if (denied) return denied;

  const admin = createAdminClient();
  if (!Deno.env.get("RESEND_API_KEY")) {
    return jsonResponse({ error: "RESEND_API_KEY not configured" }, 500);
  }

  const agora = Date.now();
  const min = new Date(agora - 24 * 3600_000).toISOString();
  const max = new Date(agora - 45 * 60_000).toISOString();

  const { data: intents } = await admin
    .from("checkout_intents")
    .select("user_id, plano, last_seen_at")
    .is("purchased_at", null)
    .is("recovered_at", null)
    .gte("last_seen_at", min)
    .lte("last_seen_at", max);

  let sent = 0;
  for (const intent of intents ?? []) {
    const { data: perfil } = await admin
      .from("profiles")
      .select("id, nome, assinante, assinante_until")
      .eq("id", intent.user_id)
      .maybeSingle();
    if (!perfil || perfil.assinante) continue;

    const { data: authUser } = await admin.auth.admin.getUserById(intent.user_id);
    const email = authUser.user?.email;
    if (!email) continue;

    const nome = escapeHtml(perfil.nome || "Jogador");
    const planoRaw = String(intent.plano || "semestral");
    const plano = PLANOS_OK.has(planoRaw) ? planoRaw : "semestral";
    const ok = await sendResendEmail({
      to: email,
      subject: `${perfil.nome || "Jogador"}, seu acesso PRO ficou pela metade`,
      html: `<p>Fala, <strong>${nome}</strong>.</p>
<p>Você começou o pagamento e não concluiu. O checkout ainda está aberto — Pix ou cartão, libera na hora.</p>
<p><a href="${appUrl()}/checkout?from=recovery&amp;plano=${plano}&amp;checkout=1">Continuar o pagamento</a></p>`,
    });
    if (!ok) continue;

    await admin
      .from("checkout_intents")
      .update({ recovered_at: new Date().toISOString() })
      .eq("user_id", intent.user_id);
    sent++;
  }

  return jsonResponse({ ok: true, sent });
});
