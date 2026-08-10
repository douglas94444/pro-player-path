import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

/**
 * Win-back D3/D7 pós-cancel — e-mail via Resend.
 * Secrets: RESEND_API_KEY, RESEND_FROM, APP_URL
 * Agende cron diário no Dashboard.
 */
Deno.serve(async () => {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM") ?? "Jogador PRO <onboarding@resend.dev>";
  const appUrl = Deno.env.get("APP_URL") ?? "https://jogadorprosystem.com";
  if (!resendKey) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), { status: 500 });
  }

  const now = Date.now();
  const dayMs = 86400000;
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

    const { data: authUser } = await admin.auth.admin.getUserById(p.id);
    const email = authUser.user?.email;
    if (!email) continue;

    const nome = p.nome || "Jogador";
    const subject =
      days === 3
        ? `${nome}, seu plano ainda está aqui`
        : `${nome}, volta pelo mensal — sem compromisso longo`;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject,
        html: `<p>Fala, <strong>${nome}</strong>.</p>
<p>Seu histórico e streak ficam salvos. Reative o acesso quando quiser.</p>
<p><a href="${appUrl}/planos?from=winback&plano=mensal">Reativar com plano mensal</a></p>`,
      }),
    });
    sent++;
  }

  return new Response(JSON.stringify({ ok: true, sent }), {
    headers: { "Content-Type": "application/json" },
  });
});
