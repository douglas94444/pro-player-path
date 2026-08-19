import { useEffect, useState } from "react";
import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { Clock, Dumbbell, Flame, Play, Sparkles, Star } from "lucide-react";
import { usePlayer } from "@/lib/player-store";
import { diaBROffset } from "@/lib/date";
import { getTreino } from "@/data/training";
import { META_SEMANAL, patenteDe, proximaConquista, xpTotal } from "@/lib/gamificacao";
import { LevelBar } from "@/components/RewardBurst";
import { cn } from "@/lib/utils";

const PROGRESSO_KEY = "jogador-pro-treino-progresso";

function lerRetomada(): { treinoId: string; idx: number } | null {
  try {
    const raw = sessionStorage.getItem(PROGRESSO_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as { treinoId: string; idx: number; ts: number; fim: boolean };
    if (p.fim) return null;
    if (Date.now() - p.ts > 6 * 60 * 60 * 1000) return null;
    return { treinoId: p.treinoId, idx: p.idx };
  } catch {
    return null;
  }
}

export const DashboardStats = memo(function DashboardStats() {
  const { state, streak, totalTreinos, totalMinutos, planoConcluidos } = usePlayer();
  const [retomar, setRetomar] = useState<{ treinoId: string; idx: number } | null>(null);

  useEffect(() => {
    setRetomar(lerRetomada());
  }, []);

  const xp = xpTotal(state.sessoes);
  const patente = patenteDe(xp);
  const proxima = proximaConquista({ totalTreinos, streak, planoConcluidos: planoConcluidos.length });

  const dias = Array.from({ length: 7 }, (_, i) => {
    const iso = diaBROffset(-(6 - i));
    const dow = new Date(`${iso}T12:00:00Z`).getUTCDay();
    return {
      iso,
      label: ["D", "S", "T", "Q", "Q", "S", "S"][dow]!,
      ativo: state.sessoes.some((s) => s.data === iso),
      hoje: i === 6,
    };
  });
  const feitosSemana = dias.filter((d) => d.ativo).length;
  const treinoRetomar = retomar ? getTreino(retomar.treinoId) : undefined;

  const cards = [
    { icon: Flame, valor: String(streak), label: "dias seguidos" },
    { icon: Dumbbell, valor: String(totalTreinos), label: "treinos feitos" },
    { icon: Clock, valor: String(totalMinutos), label: "min treinados" },
    { icon: Sparkles, valor: xp.toLocaleString("pt-BR"), label: "XP total" },
  ];

  return (
    <div className="mt-5 space-y-6">
      {treinoRetomar ? (
        <Link
          to="/treino/$treinoId"
          params={{ treinoId: treinoRetomar.id }}
          className="flex items-center gap-3 rounded-[1.5rem] border border-primary/30 bg-primary/10 px-4 py-3.5 shadow-soft"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Play className="h-4 w-4" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-extrabold text-foreground">Continue de onde parou</span>
            <span className="block text-xs text-muted-foreground">
              {treinoRetomar.nome} · exercício {retomar!.idx + 1}
            </span>
          </span>
        </Link>
      ) : null}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-border/60 bg-card p-4 text-center shadow-soft"
          >
            <c.icon className="mx-auto h-5 w-5 text-primary" />
            <p className="mt-2 text-2xl font-black tracking-tight text-foreground">{c.valor}</p>
            <p className="text-[11px] font-medium text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[1.5rem] border border-border/60 bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Meta da semana</h2>
            <span className="text-xs font-bold text-primary">
              {Math.min(feitosSemana, META_SEMANAL)}/{META_SEMANAL} treinos
            </span>
          </div>
          <LevelBar value={(Math.min(feitosSemana, META_SEMANAL) / META_SEMANAL) * 100} className="mt-3" />
          <div className="mt-5 grid grid-cols-7 gap-2">
            {dias.map((d) => (
              <div key={d.iso} className="flex flex-col items-center gap-1.5">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold sm:h-10 sm:w-10 sm:text-xs",
                    d.ativo
                      ? "bg-primary text-primary-foreground"
                      : d.hoje
                        ? "border border-dashed border-primary/50 text-primary"
                        : "bg-secondary text-muted-foreground",
                  )}
                >
                  {d.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-border/60 bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">
              Patente {patente.atual.emoji} {patente.atual.nome}
            </h2>
            <span className="text-xs font-bold text-muted-foreground">
              {patente.proxima ? `próxima: ${patente.proxima.nome}` : "máxima"}
            </span>
          </div>
          <LevelBar value={patente.progresso} className="mt-3" />
          <p className="mt-3 text-xs text-muted-foreground">
            {patente.proxima
              ? `Faltam ${patente.faltam.toLocaleString("pt-BR")} XP para ${patente.proxima.nome}.`
              : "Você chegou ao topo — mantenha o ritmo."}
          </p>

          {proxima ? (
            <div className="mt-5 rounded-2xl bg-secondary/70 p-4">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                <p className="text-xs font-bold text-foreground">Próxima conquista: {proxima.titulo}</p>
              </div>
              <LevelBar value={(proxima.atual / proxima.meta) * 100} className="mt-2 h-2" />
              <p className="mt-2 text-[11px] text-muted-foreground">
                {proxima.atual}/{proxima.meta} · {proxima.desc}
              </p>
            </div>
          ) : null}

          <Link
            to="/progresso"
            className="mt-5 inline-block text-xs font-bold text-primary underline underline-offset-4"
          >
            Ver todas as conquistas
          </Link>
        </section>
      </div>
    </div>
  );
});
