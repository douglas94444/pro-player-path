import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Flame, Play, Timer, Zap, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { usePlayer } from "@/lib/player-store";
import { TREINOS } from "@/data/training";
import { canAccessTreino } from "@/lib/access";
import { captureUtmFromLocation } from "@/lib/utm";

export const Route = createFileRoute("/")({
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
        content: "Treinos guiados de futebol em 4 semanas. Streak, níveis e evolução real.",
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
    hydrated,
    planoCompleto,
  } = usePlayer();
  const navigate = useNavigate();

  useEffect(() => {
    captureUtmFromLocation();
  }, []);

  useEffect(() => {
    if (hydrated && !state.onboardingDone) {
      void navigate({ to: "/onboarding" });
    }
  }, [hydrated, state.onboardingDone, navigate]);

  const modoRapido = () => {
    const rapidos = TREINOS.filter((t) => t.duracaoMin <= 12 && !t.premium);
    const escolhido = rapidos[Math.floor(Math.random() * rapidos.length)]!;
    navigate({ to: "/treino/$treinoId", params: { treinoId: escolhido.id } });
  };

  const treinoBloqueado =
    treinoDeHoje && !canAccessTreino(state.assinante, treinoDeHoje.id, proximoPlano?.key);

  if (!hydrated || !state.onboardingDone) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  return (
    <AppShell
      title={`Fala, ${state.nome}`}
      subtitle={`Nível: Jogador ${nivel}`}
      action={
        <div className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-sm font-bold text-foreground">
          <Flame className="h-4 w-4 text-primary" />
          {streak}
        </div>
      }
    >
      <section className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/20 to-card p-5 shadow-[0_0_40px_-20px_var(--primary)]">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">
          {planoCompleto ? "Manutenção" : "Treino de hoje"}
        </p>
        <h2 className="mt-2 text-2xl font-extrabold text-foreground">{treinoDeHoje?.nome}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{treinoDeHoje?.descricao}</p>
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Timer className="h-4 w-4" /> {treinoDeHoje?.duracaoMin} min
          <span className="mx-1">·</span>
          {planoCompleto
            ? "Ciclo contínuo"
            : `Semana ${semanaAtual} · Dia ${proximoPlano?.dia ?? 5}`}
        </div>
        {treinoDeHoje ? (
          treinoBloqueado ? (
            <Button asChild size="lg" className="mt-5 h-14 w-full rounded-2xl text-base font-extrabold">
              <Link to="/planos" search={{ from: "home" }}>
                Destravar treino PRO
              </Link>
            </Button>
          ) : (
            <Button asChild size="lg" className="mt-5 h-14 w-full rounded-2xl text-base font-extrabold">
              <Link
                to="/treino/$treinoId"
                params={{ treinoId: treinoDeHoje.id }}
                search={{ plano: proximoPlano?.key ?? "" }}
              >
                <Play className="h-5 w-5" /> COMEÇAR AGORA
              </Link>
            </Button>
          )
        ) : null}
      </section>

      <button
        onClick={modoRapido}
        className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Zap className="h-5 w-5" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-bold text-foreground">Tenho 10 minutos hoje</span>
          <span className="block text-xs text-muted-foreground">Geramos um treino rápido pra você</span>
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-foreground">
            {planoCompleto ? "Manutenção" : `Semana ${Math.min(semanaAtual, 4)} de 4`}
          </span>
          <span className="text-muted-foreground">{progressoSemana}%</span>
        </div>
        <Progress value={progressoSemana} className="mt-3" />
      </section>

      <section className="mt-6 grid gap-3">
        {[
          { to: "/plano" as const, label: "Ver plano guiado" },
          { to: "/biblioteca" as const, label: "Ver todos os treinos" },
          { to: "/progresso" as const, label: "Ver minha evolução" },
        ].map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/50"
          >
            {a.label}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </section>
    </AppShell>
  );
}
