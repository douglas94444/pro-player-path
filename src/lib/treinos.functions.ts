import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getTreino, PLANO_FLAT } from "@/data/training";
import { acessoProAtivo } from "@/lib/acesso";
import { planoKeyLiberada, treinouPlanoHoje } from "@/lib/liberacao";

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
      .select("assinante, paused_until, assinante_until")
      .eq("id", userId)
      .maybeSingle();
    if (perfilErr) throw new Error(perfilErr.message);

    const acessoAtivo = acessoProAtivo(
      Boolean(perfil?.assinante),
      perfil?.assinante_until,
      perfil?.paused_until,
    );
    if (!acessoAtivo) {
      throw new Error("Assinatura ativa necessária para registrar treinos");
    }

    const dataHoje = hojeBR();
    const minutos = treino.duracaoMin;

    // Liberação por data: 1 dia do plano por dia de calendário, sem pular a ordem.
    if (data.planoKey) {
      const { data: hist, error: histErr } = await supabase
        .from("sessoes")
        .select("data, plano_key")
        .eq("user_id", userId);
      if (histErr) throw new Error(histErr.message);
      const sessoes = (hist ?? []).map((s) => ({ data: s.data, planoKey: s.plano_key }));
      if (!planoKeyLiberada(data.planoKey, sessoes, dataHoje)) {
        throw new Error(
          treinouPlanoHoje(sessoes, dataHoje)
            ? "Você já concluiu o treino do plano hoje. O próximo dia libera à meia-noite."
            : "Este dia do plano ainda não foi liberado.",
        );
      }
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { recalcularLiga } = await import("@/lib/liga.server");

    // Idempotência: um registro por treino por dia (também garantida por UNIQUE no banco)
    const { data: existente } = await supabaseAdmin
      .from("sessoes")
      .select("id")
      .eq("user_id", userId)
      .eq("treino_id", treino.id)
      .eq("data", dataHoje)
      .maybeSingle();

    let duplicado = Boolean(existente);

    if (!existente) {
      const { error } = await supabaseAdmin.from("sessoes").insert({
        user_id: userId,
        treino_id: treino.id,
        plano_key: data.planoKey,
        data: dataHoje,
        minutos,
      });
      // 23505 = violação do UNIQUE (corrida entre dois cliques)
      if (error && error.code !== "23505") throw new Error(error.message);
      if (error) duplicado = true;
    }

    await recalcularLiga(supabaseAdmin, userId);

    return { ok: true as const, duplicado, data: dataHoje, minutos };
  });
