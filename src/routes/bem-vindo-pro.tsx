import { createFileRoute, Link } from "@tanstack/react-router";
import { Crown, MessageCircle, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageFrame } from "@/components/PageFrame";
import { PLANO, getTreino } from "@/data/training";
import { PRODUCT } from "@/lib/product-config";
import { usePlayer } from "@/lib/player-store";
import { supabase } from "@/integrations/supabase/client";
import { RouteError, RouteNotFound } from "@/components/RouteBoundary";
import { safeWrite } from "@/lib/supabase-write";

export const Route = createFileRoute("/bem-vindo-pro")({
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
  head: () => ({
    meta: [
      { title: "PRO liberado — Jogador PRO System" },
      { name: "description", content: "Sua assinatura está ativa. Comece o Dia 1 agora." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: BemVindoProPage,
});

function BemVindoProPage() {
  const { state, logado } = usePlayer();
  const semana1 = PLANO.find((s) => s.semana === 1);
  const primeiro = semana1?.dias[0];
  const treino = primeiro ? getTreino(primeiro.treinoId) : null;

  const entrarTelegram = () => {
    if (logado) {
      void supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          void safeWrite(
            "entrada no Telegram",
            () => supabase.from("profiles").update({ telegram_joined: true }).eq("id", data.user!.id),
            { table: "profiles", op: "update", payload: { telegram_joined: true }, match: { id: data.user.id } },
          );
        }
      });
    }
    window.open(PRODUCT.telegramProUrl, "_blank", "noopener,noreferrer");
  };

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
          Plano completo liberado. Faça o treino do Dia 1 hoje — ativação é o que gera resultado.
        </p>

        {treino && primeiro ? (
          <div className="mt-6 rounded-2xl border border-primary/25 bg-primary/10 p-4 text-left">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-primary">Semana 1 · Dia 1</p>
                <p className="mt-1 text-base font-extrabold text-foreground">{treino.nome}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {semana1?.foco} · {treino.duracaoMin} min
                </p>
              </div>
            </div>
            <Button asChild size="lg" className="mt-4 h-12 w-full font-extrabold">
              <Link to="/treino/$treinoId" params={{ treinoId: treino.id }} search={{ plano: "1-1" }}>
                <Play className="h-4 w-4" /> Começar meu 1º treino agora
              </Link>
            </Button>
          </div>
        ) : null}

        <Button type="button" variant="outline" className="mt-3 h-12 w-full font-extrabold" onClick={entrarTelegram}>
          <MessageCircle className="h-4 w-4" /> Entrar na comunidade PRO (Telegram)
        </Button>

        <Button asChild variant="ghost" className="mt-2 w-full">
          <Link to="/app">Ir para a home</Link>
        </Button>

      </div>
    </PageFrame>
  );
}
