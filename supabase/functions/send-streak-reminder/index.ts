import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

/**
 * Lembrete offline de streak via e-mail (Resend).
 * Secrets: RESEND_API_KEY, RESEND_FROM (ex: Jogador PRO <onboarding@...>).
 * Agende no Dashboard (cron) ou chame manualmente com service role.
 */
Deno.serve(async (req) => {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const resendKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM") ?? "Jogador PRO <onboarding@resend.dev>";
  if (!resendKey) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), { status: 500 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: assinantes } = await admin
    .from("profiles")
    .select("id, nome, reminder_hour")
    .eq("assinante", true);

  const hour = new Date().getUTCHours() - 3; // approx BRT
  const targets = (assinantes ?? []).filter((p) => (p.reminder_hour ?? 20) === ((hour + 24) % 24));

  let sent = 0;
  for (const p of targets) {
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

    const nome = p.nome || "Jogador";
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `${nome}, seu streak está em risco`,
        html: `<p>Fala, <strong>${nome}</strong>!</p>
<p>Ainda dá tempo de treinar hoje e manter a sequência no Jogador PRO.</p>
<p><a href="${Deno.env.get("APP_URL") ?? "https://jogadorprosystem.com"}">Abrir treino do dia</a></p>`,
      }),
    });
    sent++;
  }

  return new Response(JSON.stringify({ ok: true, sent, checked: targets.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
