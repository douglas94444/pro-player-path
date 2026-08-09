import { TREINOS, type Categoria, type Treino } from "@/data/training";

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

/** Treinos free alinhados ao objetivo (para biblioteca / home). */
export function treinosRecomendados(objetivo: string | null | undefined, limit = 3): Treino[] {
  const cat = categoriaPorObjetivo(objetivo);
  const free = TREINOS.filter((t) => !t.premium);
  if (!cat) return free.slice(0, limit);
  const matched = free.filter((t) => t.categorias.includes(cat));
  return (matched.length ? matched : free).slice(0, limit);
}

export function prefereModoRapido(disponibilidade: string | null | undefined): boolean {
  return disponibilidade === "10";
}
