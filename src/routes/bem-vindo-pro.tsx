import { createFileRoute, Link } from "@tanstack/react-router";
import { Crown, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageFrame } from "@/components/PageFrame";
import { PLANO, getTreino } from "@/data/training";
import { usePlayer } from "@/lib/player-store";

export const Route = createFileRoute("/bem-vindo-pro")({
  head: () => ({
    meta: [
      { title: "PRO liberado — Jogador PRO System" },
      { name: "description", content: "Sua assinatura está ativa. Comece a Semana 3 agora." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: BemVindoProPage,
});

function BemVindoProPage() {
  const { state } = usePlayer();
  const semana3 = PLANO.find((s) => s.semana === 3);
  const primeiro = semana3?.dias[0];
  const treino = primeiro ? getTreino(primeiro.treinoId) : null;

  return (
    <PageFrame max="sm" className="justify-center">
      <div className="w-full rounded-[1.75rem] border border-border/60 bg-card p-6 text-center shadow-soft-lg sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Crown className="h-8 w-8" />
        </div>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-primary">Acesso PRO</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
          {state.nome !== "Jogador" ? `${state.nome}, você é PRO` : "Você é PRO"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Semanas 3 e 4 + biblioteca premium liberadas. O próximo passo é treinar a explosão.
        </p>

        {treino && primeiro ? (
          <div className="mt-6 rounded-2xl border border-primary/25 bg-primary/10 p-4 text-left">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-primary">Semana 3 · Dia 1</p>
                <p className="mt-1 text-base font-extrabold text-foreground">{treino.nome}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {semana3?.foco} · {treino.duracaoMin} min
                </p>
              </div>
            </div>
            <Button asChild size="lg" className="mt-4 h-12 w-full font-extrabold">
              <Link to="/treino/$treinoId" params={{ treinoId: treino.id }} search={{ plano: "3-1" }}>
                <Play className="h-4 w-4" /> Começar Semana 3 agora
              </Link>
            </Button>
          </div>
        ) : null}

        <Button asChild variant="ghost" className="mt-3 w-full">
          <Link to="/">Ir para a home</Link>
        </Button>
      </div>
    </PageFrame>
  );
}
