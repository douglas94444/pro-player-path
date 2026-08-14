import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const tipoSchema = z.enum(["sugestao", "bug", "elogio"]);

const baseSchema = z.object({
  nome: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  tipo: tipoSchema,
  mensagem: z.string().trim().min(10).max(2000),
});

export const enviarSugestaoAnonima = createServerFn({ method: "POST" })
  .inputValidator((data) => baseSchema.parse(data))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const { Database } = await import("@/integrations/supabase/types");
    const supabase = createClient<Database>(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_PUBLISHABLE_KEY"]!,
      { auth: { persistSession: false } },
    );

    const { error } = await supabase.from("sugestoes").insert({
      nome: data.nome,
      email: data.email,
      tipo: data.tipo,
      mensagem: data.mensagem,
    });

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const enviarSugestaoLogado = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        tipo: tipoSchema,
        mensagem: z.string().trim().min(10).max(2000),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("nome")
      .eq("id", context.userId)
      .single();

    const { error } = await context.supabase.from("sugestoes").insert({
      user_id: context.userId,
      nome: profile?.nome ?? "Jogador",
      email: context.claims.email ?? "",
      tipo: data.tipo,
      mensagem: data.mensagem,
    });

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listarSugestoes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("is_admin");
    if (!isAdmin) throw new Error("Forbidden");

    const { data, error } = await context.supabase
      .from("sugestoes")
      .select("id, user_id, nome, email, tipo, mensagem, created_at")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  });
