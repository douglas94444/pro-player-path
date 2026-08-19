import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { Lock, Timer, Zap } from "lucide-react";
import type { Categoria, Treino } from "@/data/training";
import { CAMPANHA } from "@/data/campanha-copy";
import { intensidadeDe, xpDoTreino } from "@/lib/gamificacao";
import { cn } from "@/lib/utils";

const THUMBS: Record<Categoria, string> = {
  casa: CAMPANHA.preview.imagens[0]!,
  campo: CAMPANHA.preview.imagens[1]!,
  forca: CAMPANHA.preview.imagens[2]!,
  explosao: CAMPANHA.preview.imagens[3]!,
  core: CAMPANHA.preview.imagens[2]!,
};

export function thumbDoTreino(treino: Treino) {
  const prioridade: Categoria[] = ["explosao", "campo", "forca", "core", "casa"];
  const cat = prioridade.find((c) => treino.categorias.includes(c)) ?? "casa";
  return THUMBS[cat];
}

export type TreinoCardProps = {
  treino: Treino;
  to?: string;
  planoKey?: string;
  bloqueado?: boolean;
  legenda?: string;
  className?: string;
};

export const TreinoCard = memo(function TreinoCard({
  treino,
  to,
  planoKey,
  bloqueado = false,
  legenda,
  className,
}: TreinoCardProps) {
  const intensidade = intensidadeDe(treino);

  const conteudo = (
    <article
      className={cn(
        "group h-full overflow-hidden rounded-[1.5rem] border border-border/60 bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft-lg",
        className,
      )}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
        <img
          src={thumbDoTreino(treino)}
          alt=""
          loading="lazy"
          decoding="async"
          width={600}
          height={338}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/25 to-transparent" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-bold text-foreground backdrop-blur">
          <Timer className="h-3 w-3 text-primary" /> {treino.duracaoMin} min
        </span>
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary/90 px-2.5 py-1 text-[11px] font-black text-primary-foreground">
          +{xpDoTreino(treino.duracaoMin).toLocaleString("pt-BR")} XP
        </span>
        {bloqueado ? (
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-bold text-primary backdrop-blur">
            <Lock className="h-3 w-3" /> PRO
          </span>
        ) : null}
      </div>
      <div className="p-4">
        <p className="text-sm font-extrabold leading-tight text-foreground">{treino.nome}</p>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{treino.descricao}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-0.5" aria-label={`Intensidade ${intensidade} de 3`}>
            {[1, 2, 3].map((i) => (
              <Zap
                key={i}
                className={cn("h-3.5 w-3.5", i <= intensidade ? "text-primary" : "text-muted-foreground/30")}
              />
            ))}
          </span>
          <span className="text-[11px] font-semibold text-muted-foreground">{legenda ?? treino.nivel}</span>
        </div>
      </div>
    </article>
  );

  if (bloqueado) return conteudo;

  if (to) {
    return (
      <Link to={to} className="block h-full">
        {conteudo}
      </Link>
    );
  }

  return (
    <Link
      to="/treino/$treinoId"
      params={{ treinoId: treino.id }}
      search={planoKey ? { plano: planoKey } : {}}
      className="block h-full"
    >
      {conteudo}
    </Link>
  );
});
