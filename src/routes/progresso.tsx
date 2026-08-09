import { createFileRoute } from "@tanstack/react-router";
import { Flame, Clock, Dumbbell, Lock, Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CONQUISTAS } from "@/data/training";
import { usePlayer } from "@/lib/player-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/progresso")({
  head: () => ({
    meta: [
      { title: "Sua evolução — Jogador PRO System" },
      { name: "description", content: "Streak, treinos concluídos, tempo total e conquistas desbloqueadas." },
      { property: "og:title", content: "Sua evolução" },
      { property: "og:description", content: "Acompanhe streak, volume de treino e conquistas." },
    ],
  }),
  component: ProgressoPage,
});

function ProgressoPage() {
  const { streak, totalTreinos, totalMinutos, nivel, planoConcluidos, state } = usePlayer();

  const valorDe = (tipo: "treinos" | "streak" | "plano") =>
    tipo === "treinos" ? totalTreinos : tipo === "streak" ? streak : planoConcluidos.length;

  const ultimos7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const iso = d.toISOString().slice(0, 10);
    return { label: ["D", "S", "T", "Q", "Q", "S", "S"][d.getDay()], ativo: state.sessoes.some((s) => s.data === iso) };
  });

  return (
    <AppShell title="Sua evolução" subtitle={`Jogador ${nivel}`}>
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Flame, valor: streak, label: "dias seguidos" },
          { icon: Dumbbell, valor: totalTreinos, label: "treinos feitos" },
          { icon: Clock, valor: `${totalMinutos}`, label: "min treinados" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4 text-center">
            <s.icon className="mx-auto h-5 w-5 text-primary" />
            <p className="mt-2 text-2xl font-black text-foreground">{s.valor}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-bold text-foreground">Últimos 7 dias</h2>
        <div className="mt-4 flex justify-between">
          {ultimos7.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold",
                  d.ativo ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
                )}
              >
                {d.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-bold text-foreground">Conquistas</h2>
        <div className="grid gap-3">
          {CONQUISTAS.map((c) => {
            const atual = valorDe(c.tipo);
            const ok = atual >= c.meta;
            return (
              <div
                key={c.id}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-4",
                  ok ? "border-primary/50 bg-primary/10" : "border-border bg-card",
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl",
                    ok ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground",
                  )}
                >
                  {ok ? <Trophy className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">{c.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.desc} · {Math.min(atual, c.meta)}/{c.meta}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
