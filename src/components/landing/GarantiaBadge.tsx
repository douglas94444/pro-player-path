import { ShieldCheck } from "lucide-react";
import { CAMPANHA } from "@/data/campanha-copy";

export function GarantiaBadge({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
        {CAMPANHA.garantia.curta}
      </p>
    );
  }
  return (
    <div className="flex items-start gap-3 rounded-[1.25rem] border border-primary/30 bg-primary/5 p-5 shadow-soft">
      <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="text-base font-extrabold text-foreground">{CAMPANHA.garantia.titulo}</p>
        <p className="mt-1 text-sm text-muted-foreground">{CAMPANHA.garantia.body}</p>
      </div>
    </div>
  );
}
