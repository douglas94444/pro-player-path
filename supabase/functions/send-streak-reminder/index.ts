import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { requireCronSecret, createAdminClient } from "../_shared/auth.ts";
import { jsonResponse } from "../_shared/cors.ts";
import { sendResendEmail, appUrl, escapeHtml } from "../_shared/email.ts";

/**
 * Lembrete offline de streak via e-mail (Resend).
 * Auth: Authorization Bearer CRON_SECRET
 */
Deno.serve(async (req) => {
  const denied = await requireCronSecret(req);
  if (denied) return denied;

  const admin = createAdminClient();
  if (!Deno.env.get("RESEND_API_KEY")) {
    return jsonResponse({ error: "RESEND_API_KEY not configured" }, 500);
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: assinantes } = await admin
    .from("profiles")
    .select("id, nome, reminder_hour")
    .eq("assinante", true)
    .or("paused_until.is.null,paused_until.lte." + new Date().toISOString());

  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
  );
  const targets = (assinantes ?? []).filter((p) => (p.reminder_hour ?? 20) === hour);

  let sent = 0;
  for (const p of targets) {
    const { data: already } = await admin
      .from("lifecycle_emails")
      .select("id")
      .eq("user_id", p.id)
      .eq("kind", "streak")
      .eq("sent_on", today)
      .maybeSingle();
    if (already) continue;

    const { data: sessaoHoje } = await admin
      .from("sessoes")
      .select("id")
      .eq("user_id", p.id)
      .eq("data", today)
      .limit(1)
      .maybeSingle();
    if (sessaoHoje) continue;

    const { data: authUser } = await admin.auth.admin.getUserById(p.id);
    const email = authUser.user?.email;
    if (!email) continue;

    const nome = escapeHtml(p.nome || "Jogador");
    const ok = await sendResendEmail({
      to: email,
      subject: `${p.nome || "Jogador"}, seu streak está em risco`,
      html: `<p>Fala, <strong>${nome}</strong>!</p>
<p>Ainda dá tempo de treinar hoje e manter a sequência no Jogador PRO.</p>
<p><a href="${appUrl()}">Abrir treino do dia</a></p>`,
    });
    if (!ok) continue;

    await admin.from("lifecycle_emails").insert({ user_id: p.id, kind: "streak", sent_on: today });
    sent++;
  }

  return jsonResponse({ ok: true, sent, checked: targets.length });
});
