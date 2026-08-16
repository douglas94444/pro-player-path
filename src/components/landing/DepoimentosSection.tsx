import { Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CAMPANHA } from "@/data/campanha-copy";

export function DepoimentosSection({ onCta }: { onCta: () => void }) {
  const { depoimentos } = CAMPANHA;

  return (
    <div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {depoimentos.itens.map((d) => (
          <figure
            key={d.texto}
            className="relative flex h-full flex-col justify-between rounded-2xl border border-border/60 bg-card/80 p-5 shadow-soft backdrop-blur"
          >
            <Quote className="h-4 w-4 text-primary/70" />
            <blockquote className="mt-3 text-sm leading-relaxed text-foreground sm:text-[15px]">
              {d.texto}
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-black text-primary">
                {d.inicial}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {d.nome}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">{depoimentos.selo}</p>

      <div className="mt-8">
        <Button
          size="lg"
          className="h-14 w-full px-8 text-base font-extrabold sm:w-auto sm:min-w-[240px]"
          onClick={onCta}
        >
          {depoimentos.cta}
        </Button>
      </div>
    </div>
  );
}
