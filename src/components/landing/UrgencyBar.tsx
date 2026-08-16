import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { CAMPANHA } from "@/data/campanha-copy";

function restanteAteMeiaNoite() {
  const agora = new Date();
  const fim = new Date(agora);
  fim.setHours(23, 59, 59, 999);
  const diff = Math.max(0, fim.getTime() - agora.getTime());
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

/** Barra de urgência com contagem regressiva até o fim do dia. */
export function UrgencyBar() {
  const [tempo, setTempo] = useState<string | null>(null);

  useEffect(() => {
    setTempo(restanteAteMeiaNoite());
    const id = window.setInterval(() => setTempo(restanteAteMeiaNoite()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative border-b border-border/60 bg-primary/10 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-2 gap-y-1 px-5 py-2 text-center">
        <Timer className="h-4 w-4 shrink-0 text-primary" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground sm:text-xs">
          {CAMPANHA.urgenciaBar.prefixo}{" "}
          <span className="font-black tabular-nums text-primary">{tempo ?? "--:--:--"}</span>
        </p>
        <p className="w-full text-[10px] text-muted-foreground sm:w-auto sm:text-[11px]">
          {CAMPANHA.urgenciaBar.sufixo}
        </p>
      </div>
    </div>
  );
}
