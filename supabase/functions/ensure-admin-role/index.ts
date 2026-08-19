import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { jsonResponse, optionsResponse } from "../_shared/cors.ts";
import { createAdminClient, requireUser } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const auth = await requireUser(req);
    if (auth instanceof Response) return auth;
    const { user } = auth;
    if (!user.email) return jsonResponse({ error: "Unauthorized" }, 401);
    if (!user.email_confirmed_at) {
      return jsonResponse({ error: "email_not_confirmed" }, 403);
    }

    const allowlist = (Deno.env.get("ADMIN_EMAILS") ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const isAllowlisted = allowlist.includes(user.email.toLowerCase());
    const admin = createAdminClient();

    if (isAllowlisted) {
      await admin.from("profiles").upsert(
        { id: user.id, role: "admin", nome: user.user_metadata?.nome ?? user.email.split("@")[0] },
        { onConflict: "id" },
      );
      return jsonResponse({ role: "admin" });
    }

    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();

    return jsonResponse({ role: profile?.role ?? "user" });
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: error instanceof Error ? error.message : "error" }, 500);
  }
});
