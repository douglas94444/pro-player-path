import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, Clock, Dumbbell, Lock, Trophy, Play } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProgressRing } from "@/components/ProgressRing";
import { Button } from "@/components/ui/button";
import { CONQUISTAS } from "@/data/training";
import { usePlayer } from "@/lib/player-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/progresso")({
  head: () => ({
    meta: [
      { title: "Sua evolução — Jogador PRO System" },
      { name: "description", content: "Streak, treinos concluídos, tempo total e conquistas desbloqueadas." },
      { property: "og:title", content: "Sua evolução" },
      { property: "og:description", content: "Acompanhe streak, calendário e conquistas." },
    ],
  }),
  component: ProgressoPage,
});

function ProgressoPage() {
  const {
    streak,
    totalTreinos,
    totalMinutos,
    nivel,
    planoConcluidos,
    state,
    treinoDeHoje,
    proximoPlano,
    progressoSemana,
    semanaAtual,
    planoCompleto,
  } = usePlayer();

  const valorDe = (tipo: "treinos" | "streak" | "plano") =>
    tipo === "treinos" ? totalTreinos : tipo === "streak" ? streak : planoConcluidos.length;

  // Dias free restantes no plano (S1–S2 = keys 1-* e 2-*)
  const freeKeys = ["1-1", "1-2", "1-3", "1-4", "1-5", "2-1", "2-2", "2-3", "2-4", "2-5"];
  const freeFeitos = freeKeys.filter((k) => planoConcluidos.includes(k)).length;
  const freeRestantes = Math.max(0, freeKeys.length - freeFeitos);
  const mostrarCountdownPro = !state.assinante && !planoCompleto && semanaAtual <= 2 && freeRestantes > 0;

  const ultimos7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const iso = d.toISOString().slice(0, 10);
    return { label: ["D", "S", "T", "Q", "Q", "S", "S"][d.getDay()], ativo: state.sessoes.some((s) => s.data === iso) };
  });

  if (totalTreinos === 0) {
    return (
      <AppShell title="Sua evolução" subtitle={`Jogador ${nivel}`}>
        <div className="rounded-[1.75rem] border border-dashed border-border bg-card p-8 text-center shadow-soft">
          <Trophy className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 text-xl font-extrabold text-foreground">Seu placar começa hoje</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Conclua o primeiro treino para liberar streak, calendário e conquistas.
          </p>
          {treinoDeHoje ? (
            <Button asChild size="lg" className="mt-6 h-12 w-full font-extrabold">
              <Link
                to="/treino/$treinoId"
                params={{ treinoId: treinoDeHoje.id }}
                search={{ plano: proximoPlano?.key ?? "" }}
              >
                <Play className="h-4 w-4" /> Começar primeiro treino
              </Link>
            </Button>
          ) : null}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell wide title="Sua evolução" subtitle={`Jogador ${nivel}`}>
      <section className="rounded-[1.75rem] border border-border/60 bg-card p-6 shadow-soft sm:p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <ProgressRing value={progressoSemana} size={140} stroke={12} label="semana" />
          <div className="grid w-full flex-1 grid-cols-2 gap-3 sm:max-w-md">
            <div className="rounded-2xl bg-secondary/80 p-4">
              <Dumbbell className="h-5 w-5 text-primary" />
              <p className="mt-3 text-3xl font-black text-foreground">{totalTreinos}</p>
              <p className="text-xs font-medium text-muted-foreground">Total treinos</p>
            </div>
            <div className="rounded-2xl bg-secondary/80 p-4">
              <Flame className="h-5 w-5 text-primary" />
              <p className="mt-3 text-3xl font-black text-foreground">{streak}</p>
              <p className="text-xs font-medium text-muted-foreground">Streak atual</p>
            </div>
          </div>
        </div>
        {treinoDeHoje ? (
          <Button asChild size="lg" className="mt-6 h-12 w-full font-extrabold sm:mx-auto sm:max-w-sm">
            <Link
              to="/treino/$treinoId"
              params={{ treinoId: treinoDeHoje.id }}
              search={{ plano: proximoPlano?.key ?? "" }}
            >
              <Play className="h-4 w-4" /> Continuar streak hoje
            </Link>
          </Button>
        ) : null}
      </section>

      {mostrarCountdownPro ? (
        <Link
          to="/planos"
          search={{
            from: "progresso",
            teaser:
              freeRestantes <= 2
                ? "Faltam poucos dias free — Semana 3 Explosão te espera"
                : "Depois do free vem Explosão e Performance PRO",
          }}
          className="mt-4 flex items-center justify-between gap-3 rounded-[1.25rem] border border-primary/30 bg-primary/10 px-4 py-3 shadow-soft"
        >
          <span>
            <span className="block text-sm font-extrabold text-foreground">
              {freeRestantes === 1
                ? "Falta 1 dia free para o conteúdo PRO"
                : `Faltam ${freeRestantes} dias free para o PRO`}
            </span>
            <span className="block text-xs text-muted-foreground">
              Semana 3 = explosão · Semana 4 = performance
            </span>
          </span>
          <span className="shrink-0 text-xs font-bold text-primary">Ver</span>
        </Link>
      ) : null}

      <div className="mt-4 grid grid-cols-3 gap-3 md:gap-4">
        {[
          { icon: Flame, valor: streak, label: "dias seguidos" },
          { icon: Dumbbell, valor: totalTreinos, label: "treinos feitos" },
          { icon: Clock, valor: `${totalMinutos}`, label: "min treinados" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border/60 bg-card p-4 text-center shadow-soft">
            <s.icon className="mx-auto h-5 w-5 text-primary" />
            <p className="mt-2 text-2xl font-black text-foreground">{s.valor}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <section className="mt-4 rounded-[1.5rem] border border-border/60 bg-card p-5 shadow-soft">
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
        <div className="grid gap-3 sm:grid-cols-2">
          {CONQUISTAS.map((c) => {
            const atual = valorDe(c.tipo);
            const ok = atual >= c.meta;
            return (
              <div
                key={c.id}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-4 shadow-soft",
                  ok ? "border-primary/30 bg-primary/10" : "border-border/60 bg-card",
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-2xl",
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
