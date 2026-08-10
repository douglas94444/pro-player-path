import {
  CICLOS_TEMATICOS,
  TREINOS,
  type Categoria,
  type Treino,
} from "@/data/training";

const OBJETIVO_CATEGORIA: Record<string, Categoria> = {
  base: "casa",
  controle: "campo",
  explosao: "explosao",
  jogo: "forca",
};

export function categoriaPorObjetivo(objetivo: string | null | undefined): Categoria | null {
  if (!objetivo) return null;
  return OBJETIVO_CATEGORIA[objetivo] ?? null;
}

export function labelObjetivo(objetivo: string | null | undefined): string | null {
  const map: Record<string, string> = {
    base: "base física",
    controle: "controle de bola",
    explosao: "explosão",
    jogo: "resistência de jogo",
  };
  if (!objetivo) return null;
  return map[objetivo] ?? null;
}

/** Treinos alinhados ao objetivo/posição (catálogo pago). */
export function treinosRecomendados(
  objetivo: string | null | undefined,
  posicao?: string | null,
  limit = 3,
): Treino[] {
  const cat = categoriaPorObjetivo(objetivo);
  let pool = [...TREINOS];
  if (posicao && posicao !== "qualquer") {
    const byPos = pool.filter(
      (t) => !t.posicoes?.length || t.posicoes.includes(posicao) || t.posicoes.includes("qualquer"),
    );
    if (byPos.length) pool = byPos;
  }
  if (!cat) return pool.slice(0, limit);
  const matched = pool.filter((t) => t.categorias.includes(cat));
  return (matched.length ? matched : pool).slice(0, limit);
}

export function prefereModoRapido(disponibilidade: string | null | undefined): boolean {
  return disponibilidade === "10";
}

/** Treino de retorno curto após faltas (streak quebrado / 2+ dias sem treinar). */
export function treinoRetorno(objetivo: string | null | undefined): Treino {
  if (objetivo === "explosao") return TREINOS.find((t) => t.id === "rapido-10") ?? TREINOS[0]!;
  if (objetivo === "controle") return TREINOS.find((t) => t.id === "rapido-core") ?? TREINOS[0]!;
  return TREINOS.find((t) => t.id === "base-mobilidade") ?? TREINOS[0]!;
}

/** Sugere ciclo temático pós-4 semanas conforme objetivo. */
export function cicloSugerido(objetivo: string | null | undefined) {
  if (objetivo === "explosao" || objetivo === "jogo") {
    return CICLOS_TEMATICOS.find((c) => c.id === "explosao") ?? CICLOS_TEMATICOS[0]!;
  }
  return CICLOS_TEMATICOS.find((c) => c.id === "pre-pelada") ?? CICLOS_TEMATICOS[0]!;
}

export function diasSemTreinar(sessoes: { data: string }[]): number {
  if (!sessoes.length) return 99;
  const last = [...sessoes].map((s) => s.data).sort().reverse()[0]!;
  return Math.round((Date.now() - new Date(last).getTime()) / 86400000);
}
