import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Flame, Play, Timer, Zap, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RouteError, RouteNotFound } from "@/components/RouteBoundary";
import { ProgressRing } from "@/components/ProgressRing";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/lib/player-store";
import { canAccessTreino } from "@/lib/access";
import { captureUtmFromLocation } from "@/lib/utm";
import { diaBROffset } from "@/lib/date";
import { MESES_PLANO, PLANO, TOTAL_MESES_PLANO } from "@/data/training";
import { useEsperaLiberacao } from "@/hooks/use-liberacao";

import { labelObjetivo, prefereModoRapido, treinoRapido } from "@/lib/recommendations";
import { DashboardStats } from "@/components/DashboardStats";

export const Route = createFileRoute("/app")({
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
  head: () => ({
    meta: [
      { title: "Jogador PRO System — seu treino de hoje" },
      {
        name: "description",
        content:
          "Plano guiado de treinos de futebol: explosão, controle e resistência. Abra o app e saiba exatamente o que treinar hoje.",
      },
      { property: "og:title", content: "Jogador PRO System — seu treino de hoje" },
      {
        property: "og:description",
        content: "Jornada guiada de futebol de 12 meses. Streak, níveis e evolução real.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const {
    state,
    streak,
    nivel,
    treinoDeHoje,
    semanaAtual,
    progressoSemana,
    proximoPlano,
    proximoLiberado,
    bloqueadoPorData,
    hydrated,
    planoCompleto,
    isPaused,
    totalTreinos,
    retomarAssinatura,
  } = usePlayer();
  const espera = useEsperaLiberacao();
  const navigate = useNavigate();
  const semanaPlanoAtual = PLANO.find((s) => s.semana === semanaAtual);
  const mesAtual = semanaPlanoAtual?.mes ?? TOTAL_MESES_PLANO;
  const semanaNoMes =
    semanaPlanoAtual && MESES_PLANO[mesAtual - 1]
      ? MESES_PLANO[mesAtual - 1]!.semanas.findIndex((s) => s.semana === semanaAtual) + 1
      : 1;

  useEffect(() => {
    captureUtmFromLocation();
  }, []);

  useEffect(() => {
    if (hydrated && state.assinante && !state.onboardingDone) {
      void navigate({ to: "/onboarding" });
    }
  }, [hydrated, state.assinante, state.onboardingDone, navigate]);

  const modoRapido = () => {
    if (!state.assinante) {
      void navigate({ to: "/checkout", search: { from: "home", teaser: "Modo rápido disponível no PRO" } });
      return;
    }
    const escolhido = treinoRapido(state.objetivo, state.posicao, state.ultimoTreinoId);
    void navigate({ to: "/treino/$treinoId", params: { treinoId: escolhido.id } });
  };

  const treinoBloqueado =
    treinoDeHoje && !canAccessTreino(state.assinante, treinoDeHoje.id, proximoPlano?.key);
  const focoLabel = labelObjetivo(state.objetivo);
  const querRapido = prefereModoRapido(state.disponibilidade);
  const precisaAssinar = !state.assinante && !isPaused;
  const treinouHoje = state.sessoes.some((s) => s.data === diaBROffset(0));
  const treinouOntem = state.sessoes.some((s) => s.data === diaBROffset(-1));
  const streakEmRisco = state.assinante && totalTreinos > 0 && !treinouHoje && !treinouOntem;

  if (!hydrated || (state.assinante && !state.onboardingDone)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">
          {state.assinante && !state.onboardingDone ? "Personalizando seu plano…" : "Carregando…"}
        </p>
      </div>
    );
  }

  const ctaPrincipal = treinoDeHoje ? (
    treinoBloqueado ? (
      <Button asChild size="lg" className="h-14 w-full text-base font-extrabold">
        <Link
          to="/checkout"
          search={{
            from: "home",
            teaser: `${treinoDeHoje.nome} — ${treinoDeHoje.descricao}`,
          }}
        >
          Destravar treino PRO
        </Link>
      </Button>
    ) : bloqueadoPorData ? (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">
          Treino de hoje concluído · libera em {espera}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button asChild size="lg" variant="secondary" className="h-12 text-sm font-extrabold">
            <Link to="/biblioteca">Biblioteca</Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="h-12 text-sm font-extrabold">
            <Link to="/progresso">Progresso</Link>
          </Button>
        </div>
      </div>
    ) : proximoLiberado ? (
      <Button asChild size="lg" className="h-14 w-full text-base font-extrabold">
        <Link
          to="/treino/$treinoId"
          params={{ treinoId: treinoDeHoje.id }}
          search={{ plano: proximoPlano?.key ?? "" }}
        >
          <Play className="h-5 w-5" /> Começar agora
        </Link>
      </Button>
    ) : null
  ) : null;

  return (
    <AppShell
      title={`Fala, ${state.nome}`}
      subtitle={
        treinoDeHoje
          ? `Hoje · ${treinoDeHoje.duracaoMin} min · streak ${streak}`
          : focoLabel
            ? `Jogador ${nivel} · foco em ${focoLabel}`
            : `Jogador ${nivel} · seu treino de hoje`
      }
      action={
        <Link
          to="/ranking"
          className="flex items-center gap-1.5 rounded-full bg-card px-3.5 py-2 text-sm font-bold text-foreground shadow-soft"
        >
          <Flame className="h-4 w-4 text-primary" />
          {streak}
        </Link>
      }
    >
      {isPaused && state.pausedUntil ? (
        <div className="mb-4 rounded-[1.25rem] border border-border/60 bg-secondary/50 px-4 py-3 shadow-soft">
          <p className="text-sm font-extrabold text-foreground">Modo pausa ativo</p>
          <p className="text-xs text-muted-foreground">
            Até {new Date(state.pausedUntil).toLocaleDateString("pt-BR")} · acesso PRO segue liberado · sem cobrança
            extra
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              className="font-extrabold"
              onClick={() => {
                void retomarAssinatura();
              }}
            >
              Encerrar pausa
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link to="/perfil">Gerenciar</Link>
            </Button>
          </div>
        </div>
      ) : precisaAssinar ? (
        <Link
          to="/checkout"
          search={{ from: "home", teaser: "Assine para liberar o treino do dia e o plano completo" }}
          className="mb-4 flex items-center justify-between gap-3 rounded-[1.25rem] border border-primary/30 bg-primary/10 px-4 py-3 shadow-soft"
        >
          <span>
            <span className="block text-sm font-extrabold text-foreground">Assine para treinar</span>
            <span className="block text-xs text-muted-foreground">
              Acesso completo à jornada de 12 meses + biblioteca
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-primary" />
        </Link>
      ) : null}

      {streakEmRisco ? (
        <div className="mb-4 rounded-[1.25rem] border border-primary/25 bg-primary/10 px-4 py-3 shadow-soft">
          <p className="text-sm font-extrabold text-foreground">Streak em risco</p>
          <p className="text-xs text-muted-foreground">
            Você não treinou ontem. Uma sessão de 10–20 min hoje recupera o ritmo.
          </p>
          {treinoDeHoje && !treinoBloqueado && proximoLiberado ? (
            <Button asChild size="sm" className="mt-3 font-extrabold">
              <Link
                to="/treino/$treinoId"
                params={{ treinoId: treinoDeHoje.id }}
                search={{ plano: proximoPlano?.key ?? "" }}
              >
                Treinar agora
              </Link>
            </Button>
          ) : null}
        </div>
      ) : null}

      <DashboardStats compact />

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr] lg:gap-5">
        <section className="rounded-[1.75rem] border border-border/60 bg-card p-6 shadow-soft sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            {bloqueadoPorData
              ? "Treino de hoje concluído"
              : planoCompleto
                ? "Manutenção"
                : proximoPlano
                  ? `Treino de hoje · Mês ${mesAtual} · Dia ${proximoPlano.dia} da semana ${semanaNoMes}`
                  : "Treino de hoje"}
          </p>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {treinoDeHoje?.nome}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">{treinoDeHoje?.descricao}</p>
          {focoLabel ? (
            <p className="mt-2 text-xs font-medium text-primary">Alinhado ao seu foco: {focoLabel}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 font-medium">
              <Timer className="h-3.5 w-3.5" /> {treinoDeHoje?.duracaoMin} min
            </span>
            <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 font-medium">
              {planoCompleto
                ? "Ciclo contínuo"
                : `Mês ${mesAtual} · Semana ${semanaNoMes} · Dia ${proximoPlano?.dia ?? 5}`}
            </span>
          </div>
          <div className="mt-7 hidden sm:max-w-xs md:block">{ctaPrincipal}</div>
        </section>

        <div className="flex flex-col gap-4">
          <section className="flex items-center justify-between gap-4 rounded-[1.75rem] border border-border/60 bg-card p-5 shadow-soft sm:p-6">
            <div>
              <p className="text-sm font-bold text-foreground">
                {planoCompleto ? "Manutenção" : `Mês ${mesAtual} · Semana ${semanaNoMes}`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Progresso da semana</p>
            </div>
            <ProgressRing value={progressoSemana} size={104} stroke={9} label="semana" />
          </section>

          {querRapido ? (
            <button
              onClick={modoRapido}
              className="flex w-full items-center gap-3 rounded-[1.5rem] border border-primary/40 bg-primary/10 p-4 text-left shadow-soft transition-colors hover:border-primary/60 sm:p-5"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Zap className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-bold text-foreground">Seu modo: 10 minutos</span>
                <span className="block text-xs text-muted-foreground">
                  Baseado no tempo que você escolheu no onboarding
                </span>
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ) : (
            <details className="rounded-[1.5rem] border border-border/60 bg-card p-4 shadow-soft sm:p-5">
              <summary className="cursor-pointer text-sm font-bold text-foreground">Tenho só 10 minutos hoje</summary>
              <button
                type="button"
                onClick={modoRapido}
                className="mt-3 flex w-full items-center justify-between text-left text-xs text-muted-foreground"
              >
                Geramos um treino rápido pra você
                <ChevronRight className="h-4 w-4" />
              </button>
            </details>
          )}
        </div>
      </div>

      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { to: "/plano" as const, label: "Ver plano guiado" },
          { to: "/biblioteca" as const, label: "Ver todos os treinos" },
          { to: "/progresso" as const, label: "Ver minha evolução" },
        ].map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="flex items-center justify-between rounded-2xl border border-border/60 bg-card px-4 py-3.5 text-sm font-semibold text-foreground shadow-soft transition-colors hover:border-primary/40"
          >
            {a.label}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </section>

      {ctaPrincipal ? (
        <div className="fixed inset-x-0 z-30 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden bottom-[4.75rem]">
          {ctaPrincipal}
        </div>
      ) : null}
    </AppShell>
  );
}
