import { Check } from "lucide-react";
import { CAMPANHA } from "@/data/campanha-copy";

/** Ancoragem de valor: tudo que já está incluso na assinatura. */
export function InclusoStack() {
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {CAMPANHA.incluso.itens.map((item) => (
        <div
          key={item.titulo}
          className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-soft"
        >
          <p className="flex items-center gap-2 text-base font-extrabold text-foreground">
            <Check className="h-4 w-4 shrink-0 text-primary" />
            {item.titulo}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
        </div>
      ))}
    </div>
  );
}
