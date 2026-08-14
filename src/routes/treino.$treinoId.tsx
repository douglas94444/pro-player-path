import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Flame, Lock, Pause, Play, SkipBack, SkipForward, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExerciseDemo } from "@/components/ExerciseDemo";
import { ProgressRing } from "@/components/ProgressRing";
import { getTreino, CONQUISTAS, PLANO } from "@/data/training";
import { canAccessTreino } from "@/lib/access";
import { usePlayer } from "@/lib/player-store";
import { trackMetaCustom } from "@/lib/meta-pixel";
import { hojeBR } from "@/lib/date";
import { toast } from "sonner";
import { requestStreakReminderPermission, scheduleStreakReminder } from "@/lib/streak-reminder";
import { shareProgress } from "@/lib/share-progress";
import { useTreinoVideos } from "@/lib/treino-videos";
import { RouteError, RouteNotFound } from "@/components/RouteBoundary";

export const Route = createFileRoute("/treino/$treinoId")({
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
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

const PROGRESSO_KEY = "jogador-pro-treino-progresso";
const PROGRESSO_TTL = 6 * 60 * 60 * 1000;

type ProgressoSalvo = { treinoId: string; idx: number; restante: number; fim: boolean; ts: number };

function lerProgresso(treinoId: string): ProgressoSalvo | null {
  try {
    const raw = sessionStorage.getItem(PROGRESSO_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as ProgressoSalvo;
    if (p.treinoId !== treinoId) return null;
    if (Date.now() - p.ts > PROGRESSO_TTL) return null;
    return p;
  } catch {
    return null;
  }
}

function limparProgresso() {
  try {
    sessionStorage.removeItem(PROGRESSO_KEY);
  } catch {
    /* ignore */
  }
}

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
  const videosCadastrados = useTreinoVideos(treinoId);

  const bloqueado = treino ? !canAccessTreino(state.assinante, treino.id, plano) : false;

  useEffect(() => {
    if (!treino || !bloqueado) return;
    trackMetaCustom("PaywallHit", { treino_id: treino.id, from: "treino" });
  }, [bloqueado, treino]);

  const [idx, setIdx] = useState(0);
  const [restante, setRestante] = useState(treino?.exercicios[0]?.duracaoSeg ?? 0);
  const [rodando, setRodando] = useState(true);
  const [fim, setFim] = useState(false);
  const [salvandoConclusao, setSalvandoConclusao] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [mostrarAuth, setMostrarAuth] = useState(false);
  const [sentimento, setSentimento] = useState<string | null>(null);
  const [shareDone, setShareDone] = useState(false);
  const [restaurado, setRestaurado] = useState(false);
  const [novasConquistas, setNovasConquistas] = useState<{ titulo: string; desc: string }[]>([]);
  const [semanaDesbloqueada, setSemanaDesbloqueada] = useState<number | null>(null);


  // Retoma o treino em andamento após refresh/queda de conexão.
  useEffect(() => {
    const salvo = lerProgresso(treinoId);
    if (!salvo) {
      setRestaurado(true);
      return;
    }
    setIdx(salvo.idx);
    setRestante(salvo.restante);
    setFim(salvo.fim);
    setRodando(false);
    setRestaurado(true);
    toast.message("Treino retomado", { description: "Continuamos de onde você parou." });
  }, [treinoId]);

  // Persiste o andamento a cada segundo (sessionStorage).
  useEffect(() => {
    if (!restaurado || concluido) return;
    try {
      sessionStorage.setItem(
        PROGRESSO_KEY,
        JSON.stringify({ treinoId, idx, restante, fim, ts: Date.now() } satisfies ProgressoSalvo),
      );
    } catch {
      /* ignore */
    }
  }, [restaurado, concluido, treinoId, idx, restante, fim]);

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
    if (!rodando || fim || !restaurado) return;
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
            <Link to="/app">Voltar ao início</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (bloqueado) {
    const semana3 = PLANO.find((s) => s.semana === 3);
    const teaser = `${treino.nome} · ${treino.duracaoMin} min · ${treino.descricao}`;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10 sm:px-6">
        <div className="w-full max-w-md rounded-[1.75rem] border border-border/60 bg-card p-6 shadow-soft-lg sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Lock className="h-7 w-7" />
          </div>
          <p className="mt-4 text-center text-xs font-bold uppercase tracking-[0.16em] text-primary">Conteúdo PRO</p>
          <h1 className="mt-2 text-center text-2xl font-extrabold text-foreground">{treino.nome}</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">{treino.descricao}</p>
          <ul className="mt-6 space-y-2 text-left text-sm text-foreground">
            <li className="flex gap-2">
              <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {semana3?.titulo}: {semana3?.foco}
            </li>
            <li className="flex gap-2">
              <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Plano completo de 4 semanas + biblioteca
            </li>
            <li className="flex gap-2">
              <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Comunidade PRO e progresso na nuvem
            </li>
          </ul>
          <Button
            size="lg"
            className="mt-6 h-12 w-full font-extrabold"
            onClick={() =>
              void navigate({
                to: "/planos",
                search: { from: `treino:${treino.id}`, teaser },
              })
            }
          >
            Assinar e desbloquear
          </Button>
          <Button asChild variant="ghost" className="mt-2 w-full">
            <Link to="/planos" search={{ from: `treino:${treino.id}` }}>
              Ver planos
            </Link>
          </Button>
        </div>
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
    if (salvandoConclusao) return;
    setSalvandoConclusao(true);
    try {
      await registrarConclusao();
    } finally {
      setSalvandoConclusao(false);
    }
  };

  const registrarConclusao = async () => {
    const antes = {
      treinos: totalTreinos,
      streak,
      plano: planoConcluidos.length,
    };
    try {
      await concluirTreino(treino.id, plano || undefined);
    } catch (e) {
      toast.error("Não foi possível registrar o treino", {
        description: e instanceof Error ? e.message : "Tente novamente.",
      });
      return;
    }

    const depoisTreinos = antes.treinos + 1;
    const depoisStreak = streak + (state.sessoes.some((s) => s.data === hojeBR()) ? 0 : 1);

    trackMetaCustom("CompleteWorkout", {
      treino_id: treino.id,
      minutos: treino.duracaoMin,
      plano: plano ?? "",
    });

    const desbloqueadas: { titulo: string; desc: string }[] = [];
    for (const c of CONQUISTAS) {
      const antesVal = c.tipo === "treinos" ? antes.treinos : c.tipo === "streak" ? antes.streak : antes.plano;
      const depoisVal =
        c.tipo === "treinos" ? depoisTreinos : c.tipo === "streak" ? Math.max(depoisStreak, streak) : antes.plano + (plano ? 1 : 0);
      if (antesVal < c.meta && depoisVal >= c.meta) {
        desbloqueadas.push({ titulo: c.titulo, desc: c.desc });
      }
    }
    setNovasConquistas(desbloqueadas);

    // Semana do plano fechada com este treino?
    if (plano) {
      const semanaNum = Number(plano.split("-")[0]);
      const semana = PLANO.find((s) => s.semana === semanaNum);
      if (semana) {
        const chaves = semana.dias.map((d) => `${semana.semana}-${d.dia}`);
        const feitos = new Set([...planoConcluidos, plano]);
        const fechou = chaves.every((k) => feitos.has(k));
        if (fechou && PLANO.some((s) => s.semana === semanaNum + 1)) {
          setSemanaDesbloqueada(semanaNum + 1);
        }
      }
    }

    if (canPromptAuth && totalTreinos === 0) {
      setMostrarAuth(true);
    }

    limparProgresso();
    setConcluido(true);
    playSuccessSound();
    void requestStreakReminderPermission().then((perm) => {
      if (perm === "granted") scheduleStreakReminder(state.nome, Math.max(streak, 1));
    });

  };

  if (fim && !concluido) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center sm:px-6">
        <div className="w-full max-w-md">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/15">
            <Trophy className="h-12 w-12 text-primary" />
          </div>
          <h1 className="mt-6 text-3xl font-extrabold text-foreground">Treino concluído</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {treino.nome} · {treino.duracaoMin} min. Você ficou mais perto do próximo nível.
          </p>
          <Button
            onClick={() => void concluir()}
            disabled={salvandoConclusao}
            size="lg"
            className="mt-8 h-14 w-full text-base font-extrabold"
          >
            <Check className="h-5 w-5" /> {salvandoConclusao ? "Salvando…" : "Marcar como concluído"}
          </Button>
          <Button asChild variant="ghost" className="mt-2 w-full">
            <Link to="/app">Voltar depois</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (fim && concluido) {
    const next = proximoPlano;
    const isFirst = totalTreinos <= 1;
    const streakNow = Math.max(streak, 1);
    const showShare = streakNow >= 7 || plano === "2-5";
    const shareMilestone = plano === "2-5" ? "semana2" : streakNow >= 7 ? "streak7" : "geral";

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center sm:px-6">
        <div className="w-full max-w-md">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-bold">
            <Flame className="h-4 w-4 text-primary" />
            Streak {streakNow} · Nível {nivel}
          </div>
          <h1 className="mt-6 text-3xl font-extrabold text-foreground">Mandou bem</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {treino.nome} registrado. Volte amanhã para manter a sequência.
          </p>

          {isFirst || !sentimento ? (
            <div className="mt-6 w-full rounded-2xl border border-border/60 bg-card p-4 text-left shadow-soft">
              <p className="text-sm font-bold text-foreground">Como você se sentiu?</p>
              <p className="mt-1 text-xs text-muted-foreground">Isso ajuda a personalizar seu plano.</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { id: "leve", label: "Leve" },
                  { id: "certo", label: "No ponto" },
                  { id: "pesado", label: "Pesado" },
                ].map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => {
                      setSentimento(o.id);
                      trackMetaCustom("WorkoutFeel", { feel: o.id, treino_id: treino.id });
                    }}
                    className={`rounded-xl border px-2 py-2 text-xs font-semibold ${
                      sentimento === o.id
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border/60 bg-secondary/50 text-muted-foreground"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {showShare ? (
            <div className="mt-4 w-full rounded-2xl border border-primary/30 bg-primary/10 p-4 text-left">
              <p className="text-sm font-bold text-foreground">Compartilhar minha evolução</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Story ou WhatsApp — com seu link de indicação.
              </p>
              <Button
                className="mt-3 w-full font-extrabold"
                variant="outline"
                onClick={() => {
                  void shareProgress({
                    nome: state.nome,
                    streak: streakNow,
                    treinos: totalTreinos,
                    affiliateCode: state.affiliateCode,
                    milestone: shareMilestone,
                  }).then((r) => {
                    setShareDone(true);
                    if (r === "copied") toast.success("Texto copiado");
                    else if (r === "shared") toast.success("Compartilhado");
                  });
                }}
              >
                {shareDone ? "Pronto — compartilhado" : "Compartilhar agora"}
              </Button>
            </div>
          ) : null}

          {next ? (
            <div className="mt-6 w-full rounded-2xl border border-border/60 bg-card p-4 text-left shadow-soft">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Amanhã</p>
              <p className="mt-1 text-sm font-extrabold text-foreground">
                {getTreino(next.treinoId)?.nome ?? "Próximo treino do plano"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Volte para manter o streak.</p>
            </div>
          ) : null}

          {mostrarAuth ? (
            <div className="mt-4 w-full rounded-2xl border border-border bg-card p-4 text-left">
              <p className="text-sm font-bold text-foreground">Salve seu progresso</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Crie uma conta para não perder streak se trocar de celular.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Button asChild className="flex-1 font-extrabold">
                  <Link to="/auth" search={{ from: "pos-treino" }}>
                    Criar conta
                  </Link>
                </Button>
                <Button
                  variant="ghost"
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

          <div className="mt-8 flex w-full flex-col gap-2">
            {next ? (
              <Button asChild size="lg" className="h-14 text-base font-extrabold">
                <Link to="/app">Ver treino de amanhã</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline" className="h-12">
              <Link to="/progresso">Ver minha evolução</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const exercisePct =
    atual.duracaoSeg > 0 ? Math.round(((atual.duracaoSeg - restante) / atual.duracaoSeg) * 100) : 0;
  const sessionPct = total > 0 ? Math.round((feito / total) * 100) : 0;

  return (
    <div className="relative min-h-screen bg-background">
      <div className="relative mx-auto w-full max-w-lg px-4 pb-28 pt-6 sm:px-6 md:max-w-xl md:pb-12 md:pt-10">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => navigate({ to: "/app" })}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-muted-foreground shadow-soft"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 text-center">
            <p className="truncate text-sm font-bold text-foreground">{treino.nome}</p>
            <p className="text-[11px] text-muted-foreground">
              {treino.duracaoMin} min · exercício {idx + 1}/{treino.exercicios.length}
            </p>
          </div>
          <span className="flex h-10 min-w-10 items-center justify-center rounded-full bg-card px-2 text-xs font-bold text-muted-foreground shadow-soft">
            {sessionPct}%
          </span>
        </div>

        {videosCadastrados[""] ? (
          <div className="mt-5 overflow-hidden rounded-[1.75rem] border border-border/60 bg-card p-4 shadow-soft sm:p-5">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-primary">
              Sessão completa
            </p>
            <ExerciseDemo demo="bola" nome={treino.nome} videoUrl={videosCadastrados[""] as string} />
          </div>
        ) : null}

        <div className="mt-5 overflow-hidden rounded-[1.75rem] border border-border/60 bg-card p-4 shadow-soft sm:p-5">
          <ExerciseDemo
            demo={atual.demo ?? "cardio"}
            nome={atual.nome}
            {...(() => {
              const url = videosCadastrados[atual.nome] ?? atual.videoUrl;
              return url ? { videoUrl: url } : {};
            })()}
          />
        </div>


        <div className="mt-8 flex flex-col items-center">
          <ProgressRing value={exercisePct} size={200} stroke={14}>
            <p
              role="timer"
              aria-live="polite"
              aria-atomic="true"
              aria-label={`Tempo restante do exercício: ${fmt(restante)}`}
              className="text-4xl font-black tabular-nums tracking-tight text-foreground sm:text-5xl"
            >
              {fmt(restante)}
            </p>
            <p className="mt-1 text-[11px] font-medium text-muted-foreground">restante</p>
          </ProgressRing>
          <p className="mt-5 max-w-sm text-center text-sm text-muted-foreground">{atual.dica}</p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3 sm:gap-4">
          <Button
            variant="secondary"
            size="icon"
            aria-label="Exercício anterior"
            className="h-12 w-12 shadow-soft sm:h-14 sm:w-14"
            onClick={() => irPara(idx - 1)}
          >
            <SkipBack className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            aria-label={rodando ? "Pausar treino" : "Iniciar treino"}
            className="h-16 w-16 shadow-soft-lg sm:h-20 sm:w-20"
            onClick={() => setRodando((r) => !r)}
          >
            {rodando ? <Pause className="h-7 w-7 sm:h-8 sm:w-8" /> : <Play className="h-7 w-7 sm:h-8 sm:w-8" />}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            aria-label="Próximo exercício"
            className="h-12 w-12 shadow-soft sm:h-14 sm:w-14"
            onClick={() => irPara(idx + 1)}
          >
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>


        <p className="mt-6 text-center text-sm text-muted-foreground">
          {proximo ? `Próximo: ${proximo.nome}` : "Último exercício"}
        </p>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-card/90 p-3 backdrop-blur md:static md:mt-8 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <Button
            variant="outline"
            className="h-12 w-full font-bold sm:mx-auto sm:max-w-sm"
            onClick={() => setFim(true)}
          >
            Finalizar treino
          </Button>
        </div>
      </div>
    </div>
  );
}
