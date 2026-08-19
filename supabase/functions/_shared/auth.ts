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

async function readVaultSecret(name: "cron_secret" | "mercadopago_webhook_secret") {
  const { data, error } = await createAdminClient().rpc("vault_secret", { p_name: name });
  if (error) {
    console.error("vault_secret", name, error.message);
    return "";
  }
  return typeof data === "string" ? data : "";
}

/** Env da Edge Function, com fallback no Vault (mesmo valor dos crons pg_net). */
export async function resolveSecret(
  envName: string,
  vaultName: "cron_secret" | "mercadopago_webhook_secret",
) {
  const fromEnv = Deno.env.get(envName) ?? "";
  if (fromEnv.trim()) return fromEnv;
  return readVaultSecret(vaultName);
}

/**
 * Gate para crons: `Authorization: Bearer <CRON_SECRET>`.
 * Sem secret no env nem no Vault a função recusa (fail-closed).
 */
export async function requireCronSecret(req: Request): Promise<Response | null> {
  const expected = await resolveSecret("CRON_SECRET", "cron_secret");
  if (!expected) return jsonResponse({ error: "CRON_SECRET not configured" }, 500);
  const auth = req.headers.get("Authorization") ?? "";
  const provided = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!provided || !(await secretsEqual(provided, expected))) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  return null;
}
