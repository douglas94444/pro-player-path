import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function garantirAdmin(supabase: SupabaseClient<Database>) {
  const { data } = await supabase.rpc("is_admin");
  if (!data) throw new Error("Forbidden");
}

export const searchAdminUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ q: z.string().trim().max(120).optional() }).parse(data ?? {}))
  .handler(async ({ data, context }) => {
    await garantirAdmin(context.supabase);
    const { data: rows, error } = await context.supabase.rpc("admin_search_users", {
      p_q: data.q ?? "",
    });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const setAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        userId: z.string().uuid(),
        role: z.enum(["user", "admin"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: auth } = await context.supabase.auth.getUser();
    if (!auth.user) throw new Error("Unauthorized");
    await garantirAdmin(context.supabase);
    if (auth.user.id === data.userId && data.role !== "admin") {
      throw new Error("Você não pode remover o próprio acesso admin");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("profiles").update({ role: data.role }).eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const, role: data.role };
  });
