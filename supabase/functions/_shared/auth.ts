import { createClient, type SupabaseClient, type User } from "npm:@supabase/supabase-js@2.49.1";
import { jsonResponse } from "./cors.ts";
import { secretsEqual } from "./crypto.ts";

export function createAdminClient(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

export function createUserClient(authHeader: string): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
}

export async function requireUser(
  req: Request,
): Promise<{ user: User; authHeader: string } | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonResponse({ error: "Unauthorized" }, 401);
  const supabase = createUserClient(authHeader);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return jsonResponse({ error: "Unauthorized" }, 401);
  return { user, authHeader };
}

/**
 * Gate para crons: `Authorization: Bearer <CRON_SECRET>`.
 * Sem CRON_SECRET configurado a função recusa (fail-closed).
 */
export async function requireCronSecret(req: Request): Promise<Response | null> {
  const expected = Deno.env.get("CRON_SECRET") ?? "";
  if (!expected) return jsonResponse({ error: "CRON_SECRET not configured" }, 500);
  const auth = req.headers.get("Authorization") ?? "";
  const provided = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!provided || !(await secretsEqual(provided, expected))) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  return null;
}
