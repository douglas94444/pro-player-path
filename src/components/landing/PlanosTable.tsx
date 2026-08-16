import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CAMPANHA } from "@/data/campanha-copy";
import { cn } from "@/lib/utils";

/** Planos lado a lado com ancoragem de preço; todos levam ao checkout existente. */
export function PlanosTable({ onEscolher }: { onEscolher: (plano: string) => void }) {
  return (
    <div className="mt-8 grid gap-4 lg:grid-cols-3">
      {CAMPANHA.planos.itens.map((plano) => {
        const destaque = Boolean(plano.badge) && plano.id === "semestral";
        return (
          <div
            key={plano.id}
            className={cn(
              "relative flex flex-col rounded-[1.5rem] border bg-card/70 p-6 shadow-soft",
              destaque ? "border-primary ring-1 ring-primary/40" : "border-border/60",
            )}
          >
            {plano.badge ? (
              <span
                className={cn(
                  "absolute -top-3 left-6 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                  destaque ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
                )}
              >
                {plano.badge}
              </span>
            ) : null}

            <p className="text-sm font-black uppercase tracking-[0.16em] text-primary">{plano.nome}</p>
            {plano.de ? (
              <p className="mt-3 text-xs text-muted-foreground line-through">{plano.de}</p>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">Sem fidelidade</p>
            )}
            <p className="mt-1 text-4xl font-black tracking-tight text-foreground">{plano.preco}</p>
            <p className="text-sm text-muted-foreground">{plano.periodo}</p>
            <p className="mt-1 text-sm font-bold text-primary">Equivale a {plano.equivalente}</p>

            <ul className="mt-5 flex-1 space-y-2">
              {plano.inclui.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>

            <Button
              size="lg"
              variant={destaque ? "default" : "outline"}
              className="mt-6 h-12 w-full text-sm font-extrabold"
              onClick={() => onEscolher(plano.id)}
            >
              {plano.cta}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
