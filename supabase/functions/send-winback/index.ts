import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { requireCronSecret, createAdminClient } from "../_shared/auth.ts";
import { jsonResponse } from "../_shared/cors.ts";
import { sendResendEmail, appUrl, escapeHtml } from "../_shared/email.ts";

/**
 * Win-back D3/D7 pós-cancel — e-mail via Resend.
 * Auth: Authorization Bearer CRON_SECRET
 */
Deno.serve(async (req) => {
  const denied = await requireCronSecret(req);
  if (denied) return denied;

  const admin = createAdminClient();
  if (!Deno.env.get("RESEND_API_KEY")) {
    return jsonResponse({ error: "RESEND_API_KEY not configured" }, 500);
  }

  const now = Date.now();
  const dayMs = 86400000;
  const today = new Date().toISOString().slice(0, 10);
  const { data: cancelled } = await admin
    .from("profiles")
    .select("id, nome, cancelled_at, assinante")
    .eq("assinante", false)
    .not("cancelled_at", "is", null);

  let sent = 0;
  for (const p of cancelled ?? []) {
    if (!p.cancelled_at) continue;
    const days = Math.floor((now - new Date(p.cancelled_at).getTime()) / dayMs);
    if (days !== 3 && days !== 7) continue;

    const kind = days === 3 ? "winback_d3" : "winback_d7";
    const { data: already } = await admin
      .from("lifecycle_emails")
      .select("id")
      .eq("user_id", p.id)
      .eq("kind", kind)
      .eq("sent_on", today)
      .maybeSingle();
    if (already) continue;

    const { data: authUser } = await admin.auth.admin.getUserById(p.id);
    const email = authUser.user?.email;
    if (!email) continue;

    const nome = escapeHtml(p.nome || "Jogador");
    const subject =
      days === 3
        ? `${p.nome || "Jogador"}, seu plano ainda está aqui`
        : `${p.nome || "Jogador"}, volta pelo mensal — sem compromisso longo`;

    const ok = await sendResendEmail({
      to: email,
      subject,
      html: `<p>Fala, <strong>${nome}</strong>.</p>
<p>Seu histórico e streak ficam salvos. Reative o acesso quando quiser.</p>
<p><a href="${appUrl()}/checkout?from=winback&amp;plano=mensal">Reativar com plano mensal</a></p>`,
    });
    if (!ok) continue;

    await admin.from("lifecycle_emails").insert({ user_id: p.id, kind, sent_on: today });
    sent++;
  }

  return jsonResponse({ ok: true, sent });
});
