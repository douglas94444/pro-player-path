import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Flame, Pause, Play, SkipBack, SkipForward, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ExerciseDemo } from "@/components/ExerciseDemo";
import { getTreino, CONQUISTAS } from "@/data/training";
import { canAccessTreino } from "@/lib/access";
import { usePlayer } from "@/lib/player-store";
import { trackMetaCustom } from "@/lib/meta-pixel";
import { toast } from "sonner";
import { requestStreakReminderPermission, scheduleStreakReminder } from "@/lib/streak-reminder";

export const Route = createFileRoute("/treino/$treinoId")({
  validateSearch: (search: Record<string, unknown>): { plano?: string | undefined } => ({
    plano: typeof search["plano"] === "string" ? (search["plano"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Treino em execução — Jogador PRO System" },
      { name: "description", content: "Execute seu treino guiado, exercício por exercício, sem fricção." },
      { property: "og:title", content: "Treino em execução" },
      { property: "og:description", content: "Player guiado com tempo, exercício atual e próximo." },
    ],
  }),
  component: TreinoPage,
});

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function TreinoPage() {
  const { treinoId } = Route.useParams();
  const { plano } = Route.useSearch();
  const navigate = useNavigate();
  const {
    concluirTreino,
    state,
    streak,
    nivel,
    totalTreinos,
    proximoPlano,
    canPromptAuth,
    markAuthPromptSeen,
    planoConcluidos,
  } = usePlayer();
  const treino = getTreino(treinoId);

  const bloqueado = treino ? !canAccessTreino(state.assinante, treino.id, plano) : false;

  useEffect(() => {
    if (!treino || !bloqueado) return;
    trackMetaCustom("PaywallHit", { treino_id: treino.id, from: "treino" });
    void navigate({
      to: "/planos",
      search: { from: `treino:${treino.id}` },
    });
  }, [bloqueado, treino, navigate]);

  const [idx, setIdx] = useState(0);
  const [restante, setRestante] = useState(treino?.exercicios[0]?.duracaoSeg ?? 0);
  const [rodando, setRodando] = useState(true);
  const [fim, setFim] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [mostrarAuth, setMostrarAuth] = useState(false);
  const [mostrarPaywallSoft, setMostrarPaywallSoft] = useState(false);

  const total = useMemo(() => treino?.exercicios.reduce((a, e) => a + e.duracaoSeg, 0) ?? 0, [treino]);
  const feito = useMemo(
    () =>
      (treino?.exercicios.slice(0, idx).reduce((a, e) => a + e.duracaoSeg, 0) ?? 0) +
      ((treino?.exercicios[idx]?.duracaoSeg ?? 0) - restante),
    [treino, idx, restante],
  );

  useEffect(() => {
    if (!treino || bloqueado) return;
    trackMetaCustom("StartWorkout", { treino_id: treino.id, plano: plano ?? "" });
  }, [treino, bloqueado, plano]);

  useEffect(() => {
    if (!rodando || fim) return;
    const t = setInterval(() => setRestante((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [rodando, fim]);

  useEffect(() => {
    if (restante > 0 || fim || !treino) return;
    if (idx < treino.exercicios.length - 1) {
      setIdx((i) => i + 1);
      setRestante(treino.exercicios[idx + 1]!.duracaoSeg);
    } else {
      setFim(true);
      setRodando(false);
    }
  }, [restante, idx, fim, treino]);

  if (!treino) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <div>
          <p className="text-foreground">Treino não encontrado.</p>
          <Button asChild className="mt-4">
            <Link to="/">Voltar ao início</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (bloqueado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <p className="text-sm text-muted-foreground">Redirecionando para os planos…</p>
      </div>
    );
  }

  const atual = treino.exercicios[idx]!;
  const proximo = treino.exercicios[idx + 1];

  const irPara = (novo: number) => {
    const i = Math.min(Math.max(novo, 0), treino.exercicios.length - 1);
    setIdx(i);
    setRestante(treino.exercicios[i]!.duracaoSeg);
    setFim(false);
  };

  const concluir = async () => {
    const antes = {
      treinos: totalTreinos,
      streak,
      plano: planoConcluidos.length,
    };
    concluirTreino(treino.id, plano || undefined);
    const depoisTreinos = antes.treinos + 1;
    const depoisStreak = streak + (state.sessoes.some((s) => s.data === new Date().toISOString().slice(0, 10)) ? 0 : 1);

    trackMetaCustom("CompleteWorkout", {
      treino_id: treino.id,
      minutos: treino.duracaoMin,
      plano: plano ?? "",
    });

    for (const c of CONQUISTAS) {
      const antesVal = c.tipo === "treinos" ? antes.treinos : c.tipo === "streak" ? antes.streak : antes.plano;
      const depoisVal =
        c.tipo === "treinos" ? depoisTreinos : c.tipo === "streak" ? Math.max(depoisStreak, streak) : antes.plano + (plano ? 1 : 0);
      if (antesVal < c.meta && depoisVal >= c.meta) {
        toast.success(`Conquista: ${c.titulo}`, { description: c.desc });
      }
    }

    // Soft paywall: concluiu o último dia free (semana 2 dia 5)
    if (plano === "2-5" && !state.assinante) {
      setMostrarPaywallSoft(true);
    }

    if (canPromptAuth && totalTreinos === 0) {
      setMostrarAuth(true);
    }

    setConcluido(true);
    void requestStreakReminderPermission().then((perm) => {
      if (perm === "granted") scheduleStreakReminder(state.nome, Math.max(streak, 1));
    });
  };

  if (fim && !concluido) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/15">
          <Trophy className="h-12 w-12 text-primary" />
        </div>
        <h1 className="mt-6 text-3xl font-extrabold text-foreground">Treino concluído</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {treino.nome} · {treino.duracaoMin} min. Você ficou mais perto do próximo nível.
        </p>
        <Button onClick={() => void concluir()} size="lg" className="mt-8 h-14 w-full max-w-sm rounded-2xl text-base font-extrabold">
          <Check className="h-5 w-5" /> Marcar como concluído
        </Button>
        <Button asChild variant="ghost" className="mt-2">
          <Link to="/">Voltar depois</Link>
        </Button>
      </div>
    );
  }

  if (fim && concluido) {
    const next = proximoPlano;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-bold">
          <Flame className="h-4 w-4 text-primary" />
          Streak {streak || 1} · Nível {nivel}
        </div>
        <h1 className="mt-6 text-3xl font-extrabold text-foreground">Mandou bem</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {treino.nome} registrado. Volte amanhã para manter a sequência.
        </p>

        {mostrarPaywallSoft ? (
          <div className="mt-6 w-full max-w-sm rounded-2xl border border-primary/40 bg-primary/10 p-4 text-left">
            <p className="text-sm font-bold text-foreground">Próximo nível é PRO</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Semanas 3 e 4 + biblioteca premium desbloqueiam com a assinatura.
            </p>
            <Button asChild className="mt-3 w-full rounded-xl font-extrabold">
              <Link to="/planos" search={{ from: "soft-paywall" }}>
                Ver planos
              </Link>
            </Button>
          </div>
        ) : null}

        {mostrarAuth ? (
          <div className="mt-4 w-full max-w-sm rounded-2xl border border-border bg-card p-4 text-left">
            <p className="text-sm font-bold text-foreground">Salve seu progresso</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Crie uma conta grátis para não perder streak se trocar de celular.
            </p>
            <div className="mt-3 flex gap-2">
              <Button asChild className="flex-1 rounded-xl font-extrabold">
                <Link to="/auth" search={{ from: "pos-treino" }}>
                  Criar conta
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="rounded-xl"
                onClick={() => {
                  markAuthPromptSeen();
                  setMostrarAuth(false);
                }}
              >
                Agora não
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex w-full max-w-sm flex-col gap-2">
          {next ? (
            <Button asChild size="lg" className="h-14 rounded-2xl text-base font-extrabold">
              <Link to="/">Ver treino de amanhã</Link>
            </Button>
          ) : null}
          <Button asChild variant="outline" className="h-12 rounded-2xl">
            <Link to="/progresso">Ver minha evolução</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-md px-5 pb-10 pt-6">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate({ to: "/" })} className="text-muted-foreground" aria-label="Voltar">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-foreground">{treino.nome}</span>
          <span className="text-sm text-muted-foreground">
            {idx + 1}/{treino.exercicios.length}
          </span>
        </div>

        <div className="mt-6">
          <ExerciseDemo demo={atual.demo ?? "cardio"} nome={atual.nome} />
          <p className="mt-6 text-center text-6xl font-black tabular-nums text-foreground">{fmt(restante)}</p>
        </div>

        <Progress value={Math.round((feito / total) * 100)} className="mt-5" />
        <p className="mt-2 text-center text-xs text-muted-foreground">{atual.dica}</p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <Button variant="secondary" size="icon" className="h-14 w-14 rounded-2xl" onClick={() => irPara(idx - 1)}>
            <SkipBack className="h-5 w-5" />
          </Button>
          <Button size="icon" className="h-20 w-20 rounded-3xl" onClick={() => setRodando((r) => !r)}>
            {rodando ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
          </Button>
          <Button variant="secondary" size="icon" className="h-14 w-14 rounded-2xl" onClick={() => irPara(idx + 1)}>
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {proximo ? `Próximo: ${proximo.nome}` : "Último exercício"}
        </p>

        <Button variant="outline" className="mt-8 w-full rounded-2xl" onClick={() => setFim(true)}>
          Finalizar treino
        </Button>
      </div>
    </div>
  );
}
