import { CONQUISTAS, type Treino } from "@/data/training";
import type { Sessao } from "@/lib/player-store";

/** XP por minuto treinado — regra única do app. */
export const XP_POR_MINUTO = 100;

export function xpDoTreino(minutos: number) {
  return Math.round(minutos * XP_POR_MINUTO);
}

export function xpTotal(sessoes: Sessao[]) {
  return sessoes.reduce((acc, s) => acc + xpDoTreino(s.minutos), 0);
}

export type Patente = {
  id: string;
  nome: string;
  xp: number;
  emoji: string;
};

/** Patentes por XP acumulado (Bronze → Elite). */
export const PATENTES: Patente[] = [
  { id: "bronze", nome: "Bronze", xp: 0, emoji: "🥉" },
  { id: "prata", nome: "Prata", xp: 6000, emoji: "🥈" },
  { id: "ouro", nome: "Ouro", xp: 18000, emoji: "🥇" },
  { id: "elite", nome: "Elite", xp: 40000, emoji: "🏆" },
];

export function patenteDe(xp: number) {
  let atual = PATENTES[0]!;
  for (const p of PATENTES) if (xp >= p.xp) atual = p;
  const idx = PATENTES.indexOf(atual);
  const proxima = PATENTES[idx + 1] ?? null;
  const base = atual.xp;
  const alvo = proxima?.xp ?? atual.xp;
  const progresso = proxima ? Math.round(((xp - base) / (alvo - base)) * 100) : 100;
  return {
    atual,
    proxima,
    progresso: Math.max(0, Math.min(100, progresso)),
    faltam: proxima ? Math.max(0, alvo - xp) : 0,
  };
}

/** Meta padrão de treinos por semana. */
export const META_SEMANAL = 5;

export type ConquistaProgresso = {
  id: string;
  titulo: string;
  desc: string;
  meta: number;
  atual: number;
  concluida: boolean;
};

export function progressoConquistas(input: {
  totalTreinos: number;
  streak: number;
  planoConcluidos: number;
}): ConquistaProgresso[] {
  return CONQUISTAS.map((c) => {
    const atual =
      c.tipo === "treinos" ? input.totalTreinos : c.tipo === "streak" ? input.streak : input.planoConcluidos;
    return {
      id: c.id,
      titulo: c.titulo,
      desc: c.desc,
      meta: c.meta,
      atual: Math.min(atual, c.meta),
      concluida: atual >= c.meta,
    };
  });
}

export function proximaConquista(input: {
  totalTreinos: number;
  streak: number;
  planoConcluidos: number;
}): ConquistaProgresso | null {
  const pendentes = progressoConquistas(input).filter((c) => !c.concluida);
  if (!pendentes.length) return null;
  return pendentes.sort((a, b) => b.atual / b.meta - a.atual / a.meta)[0]!;
}

export function intensidadeDe(treino: Treino) {
  if (treino.categorias.includes("explosao")) return 3;
  if (treino.categorias.includes("forca")) return 3;
  if (treino.categorias.includes("campo")) return 2;
  return treino.duracaoMin >= 18 ? 3 : treino.duracaoMin >= 12 ? 2 : 1;
}
