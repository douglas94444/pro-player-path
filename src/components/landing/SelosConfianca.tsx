import { CreditCard, ShieldCheck, Zap } from "lucide-react";
import { CAMPANHA } from "@/data/campanha-copy";

const ICONES = [Zap, CreditCard, ShieldCheck];

/** Selos de confiança abaixo dos CTAs principais. */
export function SelosConfianca() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {CAMPANHA.selos.map((selo, i) => {
        const Icone = ICONES[i % ICONES.length]!;
        return (
          <li key={selo} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Icone className="h-3.5 w-3.5 text-primary" />
            {selo}
          </li>
        );
      })}
    </ul>
  );
}
