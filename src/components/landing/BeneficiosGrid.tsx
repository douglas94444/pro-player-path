import {
  CalendarDays,
  Clock,
  Cloud,
  Flame,
  LibraryBig,
  Smartphone,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { CAMPANHA } from "@/data/campanha-copy";

const ICONES: Record<string, LucideIcon> = {
  calendar: CalendarDays,
  clock: Clock,
  zap: Zap,
  flame: Flame,
  trophy: Trophy,
  library: LibraryBig,
  phone: Smartphone,
  cloud: Cloud,
};

/** Grid escaneável de benefícios com ícones. */
export function BeneficiosGrid() {
  return (
    <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {CAMPANHA.beneficiosIcones.itens.map((item) => {
        const Icone = ICONES[item.icone] ?? Zap;
        return (
          <li
            key={item.texto}
            className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card/70 p-4 shadow-soft"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Icone className="h-4.5 w-4.5" />
            </span>
            <p className="text-xs font-semibold leading-snug text-foreground sm:text-sm">{item.texto}</p>
          </li>
        );
      })}
    </ul>
  );
}
