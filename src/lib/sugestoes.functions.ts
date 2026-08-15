import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const tipoSchema = z.enum(["sugestao", "bug", "elogio"]);

const baseSchema = z.object({
  nome: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  tipo: tipoSchema,
  mensagem: z.string().trim().min(10).max(2000),
});

const LIMITE_POR_HORA = 5;

/** Chave anônima do remetente: hash do IP + e-mail (não guardamos o IP cru). */
async function chaveRemetente(email: string) {
  const { getRequestIP } = await import("@tanstack/react-start/server");
  let ip = "";
  try {
    ip = getRequestIP({ xForwardedFor: true }) ?? "";
  } catch {
    ip = "";
  }
  const bytes = new TextEncoder().encode(`${ip}|${email.toLowerCase()}`);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const enviarSugestaoAnonima = createServerFn({ method: "POST" })
  .inputValidator((data) => baseSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Limite de envios: 5 por hora por remetente (IP + e-mail).
    const chave = await chaveRemetente(data.email);
    const janela = new Date(Math.floor(Date.now() / 3_600_000) * 3_600_000).toISOString();

    const { data: atual } = await supabaseAdmin
      .from("sugestoes_rate_limit")
      .select("id, envios")
      .eq("chave", chave)
      .eq("janela", janela)
      .maybeSingle();

    if (atual && atual.envios >= LIMITE_POR_HORA) {
      throw new Error("Muitos envios seguidos. Tente novamente daqui a pouco.");
    }

    if (atual) {
      await supabaseAdmin
        .from("sugestoes_rate_limit")
        .update({ envios: atual.envios + 1 })
        .eq("id", atual.id);
    } else {
      await supabaseAdmin.from("sugestoes_rate_limit").insert({ chave, janela, envios: 1 });
    }

    const { error } = await supabaseAdmin.from("sugestoes").insert({
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
