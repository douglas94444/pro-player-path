import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getTreino, PLANO_FLAT } from "@/data/training";

type ConcluirInput = { treinoId: string; planoKey?: string | null };

function hojeBR() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

function planoKeyValido(key: string) {
  if (PLANO_FLAT.some((p) => p.key === key)) return true;
  // chaves geradas dinamicamente pelo app (ciclos, manutenção, retorno)
  return /^(c-[a-z0-9-]+-\d+|m-\d+|retorno-\d{4}-\d{2}-\d{2})$/.test(key);
}

/**
 * Registra a conclusão de um treino no servidor.
 * Toda validação (assinatura, treino existente, minutos e idempotência diária)
 * acontece aqui — o cliente nunca escolhe os minutos nem burla o paywall.
 */
export const concluirTreinoServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ConcluirInput) => {
    if (!input || typeof input.treinoId !== "string" || input.treinoId.length > 80) {
      throw new Error("treinoId inválido");
    }
    const planoKey =
      typeof input.planoKey === "string" && input.planoKey.length > 0 ? input.planoKey : null;
    if (planoKey && (planoKey.length > 60 || !planoKeyValido(planoKey))) {
      throw new Error("planoKey inválido");
    }
    return { treinoId: input.treinoId, planoKey };
  })
  .handler(async ({ data, context }) => {
    const treino = getTreino(data.treinoId);
    if (!treino) throw new Error("Treino não encontrado");

    const { supabase, userId } = context;

    const { data: perfil, error: perfilErr } = await supabase
      .from("profiles")
      .select("assinante, paused_until")
      .eq("id", userId)
      .maybeSingle();
    if (perfilErr) throw new Error(perfilErr.message);

    const pausado = Boolean(
      perfil?.paused_until && new Date(perfil.paused_until).getTime() > Date.now(),
    );
    if (!perfil?.assinante || pausado) {
      throw new Error("Assinatura ativa necessária para registrar treinos");
    }

    const dataHoje = hojeBR();
    const minutos = treino.duracaoMin;

    // Idempotência: um registro por treino por dia
    const { data: existente } = await supabase
      .from("sessoes")
      .select("id")
      .eq("user_id", userId)
      .eq("treino_id", treino.id)
      .eq("data", dataHoje)
      .maybeSingle();

    if (existente) {
      return { ok: true as const, duplicado: true as const, data: dataHoje, minutos };
    }

    const { error } = await supabase.from("sessoes").insert({
      user_id: userId,
      treino_id: treino.id,
      plano_key: data.planoKey,
      data: dataHoje,
      minutos,
    });
    if (error) throw new Error(error.message);

    return { ok: true as const, duplicado: false as const, data: dataHoje, minutos };
  });
