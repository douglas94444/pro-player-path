import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { jsonResponse, optionsResponse } from "../_shared/cors.ts";
import { createAdminClient, requireUser } from "../_shared/auth.ts";

type Body = {
  action?: "cancel" | "pause" | "resume" | "downgrade_mensal";
  motivo?: string | null;
  dias?: number;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const auth = await requireUser(req);
    if (auth instanceof Response) return auth;
    const { user } = auth;

    const body = (await req.json().catch(() => ({}))) as Body;
    const action = body.action ?? "cancel";
    const admin = createAdminClient();

    if (action === "pause") {
      const { data: perfil } = await admin
        .from("profiles")
        .select("assinante, assinante_until, paused_until, pause_used_at")
        .eq("id", user.id)
        .maybeSingle();
      if (!perfil?.assinante) return jsonResponse({ error: "not_subscriber" }, 400);
      if (perfil.paused_until && new Date(perfil.paused_until).getTime() > Date.now()) {
        return jsonResponse({ error: "already_paused" }, 400);
      }
      if (perfil.pause_used_at) {
        const used = new Date(perfil.pause_used_at).getTime();
        const until = perfil.assinante_until ? new Date(perfil.assinante_until).getTime() : 0;
        if (!until || used < until) return jsonResponse({ error: "pause_already_used" }, 400);
      }

      const dias = Math.min(30, Math.max(1, Number(body.dias) || 7));
      const until = new Date();
      until.setUTCDate(until.getUTCDate() + dias);
      const { error } = await admin
        .from("profiles")
        .update({
          paused_until: until.toISOString(),
          pause_reason: body.motivo ?? "save_offer",
          pause_used_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      if (error) throw error;
      return jsonResponse({ ok: true, action, paused_until: until.toISOString() });
    }

    if (action === "resume") {
      const { data: perfil } = await admin
        .from("profiles")
        .select("paused_until, pause_used_at, assinante_until")
        .eq("id", user.id)
        .maybeSingle();

      let assinanteUntil = perfil?.assinante_until ?? null;
      if (perfil?.paused_until && perfil.pause_used_at) {
        const pausedStart = new Date(perfil.pause_used_at).getTime();
        const pausedEnd = Math.min(Date.now(), new Date(perfil.paused_until).getTime());
        const elapsedMs = Math.max(0, pausedEnd - pausedStart);
        if (assinanteUntil && elapsedMs > 0) {
          assinanteUntil = new Date(new Date(assinanteUntil).getTime() + elapsedMs).toISOString();
        }
      }

      const { error } = await admin
        .from("profiles")
        .update({
          paused_until: null,
          pause_reason: null,
          ...(assinanteUntil ? { assinante_until: assinanteUntil } : {}),
        })
        .eq("id", user.id);
      if (error) throw error;
      return jsonResponse({ ok: true, action });
    }

    if (action === "downgrade_mensal") {
      const { data: perfil } = await admin.from("profiles").select("assinante, plano").eq("id", user.id).maybeSingle();
      if (!perfil?.assinante) return jsonResponse({ error: "not_subscriber" }, 400);
      const { error } = await admin
        .from("profiles")
        .update({
          plano: "mensal",
          paused_until: null,
          pause_reason: null,
          cancel_reason: body.motivo ?? "downgrade_mensal",
        })
        .eq("id", user.id);
      if (error) throw error;
      return jsonResponse({ ok: true, action, plano: "mensal" });
    }

    await admin
      .from("profiles")
      .update({
        assinante: false,
        plano: null,
        assinante_until: null,
        mp_payment_id: null,
        paused_until: null,
        pause_reason: null,
        cancel_reason: body.motivo ?? null,
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    return jsonResponse({ ok: true, action: "cancel" });
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: error instanceof Error ? error.message : "error" }, 500);
  }
});
