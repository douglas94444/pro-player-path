import { Clock, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CAMPANHA } from "@/data/campanha-copy";
import { TREINOS } from "@/data/training";

/** Cards com treinos reais do catálogo — prova de conteúdo antes do preço. */
export function PreviewTreinos({ onCta }: { onCta: () => void }) {
  const imagens = CAMPANHA.preview.imagens;
  const treinos = CAMPANHA.preview.ids
    .map((id) => TREINOS.find((t) => t.id === id))
    .filter((t): t is (typeof TREINOS)[number] => Boolean(t));

  return (
    <>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {treinos.map((treino, i) => (
          <article
            key={treino.id}
            className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-soft"
          >
            <div className="relative aspect-video overflow-hidden bg-background/60">
              <img
                src={imagens[i % imagens.length]}
                alt={`Treino ${treino.nome}`}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover opacity-80"
              />
              <span className="absolute inset-0 flex items-center justify-center">
                <PlayCircle className="h-9 w-9 text-primary drop-shadow" />
              </span>
              <span className="absolute left-3 top-3 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                {treino.nivel}
              </span>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-extrabold leading-snug text-foreground sm:text-base">
                {treino.nome}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:text-sm">
                {treino.descricao}
              </p>
              <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                <Clock className="h-3.5 w-3.5" />
                {treino.duracaoMin} min · {treino.exercicios.length} exercícios
              </p>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-8">
        <Button size="lg" className="h-14 w-full text-base font-extrabold sm:w-auto sm:min-w-[260px]" onClick={onCta}>
          {CAMPANHA.preview.cta}
        </Button>
      </div>
    </>
  );
}
