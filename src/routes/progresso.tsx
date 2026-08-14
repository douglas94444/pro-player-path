import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, Clock, Dumbbell, Lock, Trophy, Play } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProgressRing } from "@/components/ProgressRing";
import { Button } from "@/components/ui/button";
import { CONQUISTAS } from "@/data/training";
import { usePlayer } from "@/lib/player-store";
import { diaBROffset, inicioSemanaBR } from "@/lib/date";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { RouteError, RouteNotFound } from "@/components/RouteBoundary";

export const Route = createFileRoute("/progresso")({
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
  head: () => ({
    meta: [
      { title: "Sua evolução — Jogador PRO System" },
      { name: "description", content: "Streak, treinos, scores semanais e conquistas." },
    ],
  }),
  component: ProgressoPage,
});

function weekStartIso() {
  return inicioSemanaBR();
}

type Score = {
  week_start: string;
  explosao: number;
  controle: number;
  resistencia: number;
  jogou: boolean;
};

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
    logado,
  } = usePlayer();

  const [scores, setScores] = useState<Score[]>([]);
  const [explosao, setExplosao] = useState(3);
  const [controle, setControle] = useState(3);
  const [resistencia, setResistencia] = useState(3);
  const [jogou, setJogou] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!logado) return;
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: rows } = await supabase
        .from("weekly_scores")
        .select("week_start, explosao, controle, resistencia, jogou")
        .eq("user_id", data.user.id)
        .order("week_start", { ascending: true })
        .limit(12);
      setScores((rows as Score[]) ?? []);
    });
  }, [logado]);

  const valorDe = (tipo: "treinos" | "streak" | "plano") =>
    tipo === "treinos" ? totalTreinos : tipo === "streak" ? streak : planoConcluidos.length;

  const ultimos7 = Array.from({ length: 7 }, (_, i) => {
    const iso = diaBROffset(-(6 - i));
    const dow = new Date(`${iso}T12:00:00Z`).getUTCDay();
    return { label: ["D", "S", "T", "Q", "Q", "S", "S"][dow], ativo: state.sessoes.some((s) => s.data === iso) };
  });

  const salvarScore = async () => {
    if (!logado) {
      toast.message("Entre na conta para salvar scores na nuvem");
      return;
    }
    setSalvando(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const week_start = weekStartIso();
      const { error } = await supabase.from("weekly_scores").upsert(
        {
          user_id: user.id,
          week_start,
          explosao,
          controle,
          resistencia,
          jogou,
        },
        { onConflict: "user_id,week_start" },
      );
      if (error) throw error;
      setScores((prev) => {
        const rest = prev.filter((s) => s.week_start !== week_start);
        return [...rest, { week_start, explosao, controle, resistencia, jogou }].sort((a, b) =>
          a.week_start.localeCompare(b.week_start),
        );
      });
      toast.success("Score da semana salvo");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar");
    } finally {
      setSalvando(false);
    }
  };

  if (!state.assinante) {
    return (
      <AppShell title="Sua evolução" subtitle="Disponível no PRO">
        <div className="rounded-[1.75rem] border border-border/60 bg-card p-8 text-center shadow-soft">
          <Trophy className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 text-xl font-extrabold text-foreground">Evolução com assinatura</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Streak, scores no campo e conquistas liberam após assinar.
          </p>
          <Button asChild size="lg" className="mt-6 h-12 w-full font-extrabold">
            <Link to="/planos" search={{ from: "progresso" }}>
              Ver planos
            </Link>
          </Button>
        </div>
      </AppShell>
    );
  }

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

      <section className="mt-4 rounded-[1.5rem] border border-border/60 bg-card p-5 shadow-soft">
        <h2 className="text-sm font-bold text-foreground">Score semanal no campo</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Autoavaliação 1–5. Isso alimenta sua evolução e personalização.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Explosão", value: explosao, set: setExplosao },
            { label: "Controle", value: controle, set: setControle },
            { label: "Resistência", value: resistencia, set: setResistencia },
          ].map((row) => (
            <label key={row.label} className="rounded-2xl bg-secondary/60 p-3">
              <span className="text-xs font-semibold text-muted-foreground">{row.label}</span>
              <input
                type="range"
                min={1}
                max={5}
                value={row.value}
                onChange={(e) => row.set(Number(e.target.value))}
                className="mt-2 w-full accent-primary"
              />
              <span className="text-sm font-bold text-foreground">{row.value}/5</span>
            </label>
          ))}
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={jogou} onChange={(e) => setJogou(e.target.checked)} />
          Joguei bola esta semana
        </label>
        <Button className="mt-4 w-full font-extrabold" disabled={salvando} onClick={() => void salvarScore()}>
          {salvando ? "Salvando…" : "Salvar score da semana"}
        </Button>
        {scores.length ? (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Histórico</p>
            {scores.slice(-6).map((s) => (
              <div key={s.week_start} className="flex justify-between rounded-xl bg-secondary/50 px-3 py-2 text-xs">
                <span className="text-muted-foreground">{s.week_start}</span>
                <span className="font-semibold text-foreground">
                  E{s.explosao} · C{s.controle} · R{s.resistencia}
                  {s.jogou ? " · jogou" : ""}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </section>

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

      <Button asChild variant="outline" className="mt-4 w-full">
        <Link to="/ranking">Ver ranking da semana</Link>
      </Button>
    </AppShell>
  );
}
