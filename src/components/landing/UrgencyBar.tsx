import { ShieldCheck } from "lucide-react";
import { CAMPANHA } from "@/data/campanha-copy";

/** Barra de confiança — garantia real, sem countdown falso. */
export function UrgencyBar() {
  return (
    <div className="relative border-b border-border/60 bg-primary/10 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-2 gap-y-1 px-5 py-2 text-center">
        <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground sm:text-xs">
          {CAMPANHA.urgenciaBar.prefixo}
        </p>
        <p className="w-full text-[10px] text-muted-foreground sm:w-auto sm:text-[11px]">
          {CAMPANHA.urgenciaBar.sufixo}
        </p>
      </div>
    </div>
  );
}
