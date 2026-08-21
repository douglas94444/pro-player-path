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
            <blockquote className="text-sm leading-relaxed text-foreground sm:text-[15px]">
              {d.texto}
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-black text-primary">
                {d.inicial}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-foreground">{d.nome}</span>
                <span className="block text-xs text-muted-foreground">Aluno PRO</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>

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
