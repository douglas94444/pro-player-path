import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Body = {
  action?: "cancel" | "pause" | "resume" | "downgrade_mensal";
  motivo?: string | null;
  dias?: number;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
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
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    const action = body.action ?? "cancel";
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (action === "pause") {
      const dias = Math.min(30, Math.max(1, Number(body.dias) || 7));
      const until = new Date();
      until.setDate(until.getDate() + dias);
      const { error } = await admin
        .from("profiles")
        .update({
          paused_until: until.toISOString(),
          pause_reason: body.motivo ?? "save_offer",
        })
        .eq("id", user.id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, action, paused_until: until.toISOString() }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (action === "resume") {
      const { error } = await admin
        .from("profiles")
        .update({ paused_until: null, pause_reason: null })
        .eq("id", user.id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, action }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (action === "downgrade_mensal") {
      const { data: perfil } = await admin.from("profiles").select("assinante, plano").eq("id", user.id).maybeSingle();
      if (!perfil?.assinante) {
        return new Response(JSON.stringify({ error: "not_subscriber" }), {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
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
      return new Response(JSON.stringify({ ok: true, action, plano: "mensal" }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    await admin
      .from("profiles")
      .update({
        assinante: false,
        plano: null,
        mp_payment_id: null,
        paused_until: null,
        pause_reason: null,
        cancel_reason: body.motivo ?? null,
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    return new Response(JSON.stringify({ ok: true, action: "cancel" }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "error" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
