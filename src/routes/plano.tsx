import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Lock, Play } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PLANO, getTreino } from "@/data/training";
import { isSemanaPremium } from "@/lib/access";
import { usePlayer } from "@/lib/player-store";
import { trackMetaCustom } from "@/lib/meta-pixel";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/plano")({
  head: () => ({
    meta: [
      { title: "Plano guiado de 4 semanas — Jogador PRO System" },
      {
        name: "description",
        content: "Base, controle, explosão e performance: siga o plano dia a dia e destrave o próximo treino.",
      },
      { property: "og:title", content: "Plano guiado de 4 semanas" },
      { property: "og:description", content: "Um treino por dia, liberado conforme você evolui." },
    ],
  }),
  component: PlanoPage,
});

function PlanoPage() {
  const { planoConcluidos, proximoPlano, state, planoCompleto } = usePlayer();
  const navigate = useNavigate();

  return (
    <AppShell
      title="Plano guiado"
      subtitle={planoCompleto ? "Ciclo de manutenção ativo" : "Um caminho só: siga os dias em ordem"}
    >
      {planoCompleto ? (
        <div className="mb-6 rounded-2xl border border-primary/30 bg-primary/10 p-4">
          <p className="text-sm font-bold text-foreground">4 semanas concluídas</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Você entrou no ciclo de manutenção. Continue o hábito com treinos diários rotativos.
          </p>
          {proximoPlano ? (
            <Link
              to="/treino/$treinoId"
              params={{ treinoId: proximoPlano.treinoId }}
              search={{ plano: proximoPlano.key }}
              className="mt-3 inline-flex text-sm font-bold text-primary underline underline-offset-4"
            >
              Abrir treino de manutenção
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-6">
        {PLANO.map((semana) => {
          const semanaPremium = Boolean(semana.premium) || isSemanaPremium(semana.semana);
          return (
            <section key={semana.semana} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-extrabold text-foreground">{semana.titulo}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{semana.foco}</p>
                </div>
                {semanaPremium ? (
                  <span className="shrink-0 rounded-full bg-primary/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                    PRO
                  </span>
                ) : null}
              </div>
              <ul className="mt-4 space-y-2">
                {semana.dias.map((dia) => {
                  const key = `${semana.semana}-${dia.dia}`;
                  const treino = getTreino(dia.treinoId)!;
                  const concluido = planoConcluidos.includes(key);
                  const atual = proximoPlano?.key === key;
                  const precisaAssinatura = semanaPremium && !state.assinante;
                  const bloqueadoOrdem = !concluido && !atual;

                  const inner = (
                    <div
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-4 py-3",
                        atual
                          ? "border-primary bg-primary/10"
                          : concluido
                            ? "border-border bg-secondary"
                            : "border-border bg-background opacity-60",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg",
                          atual ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
                        )}
                      >
                        {concluido ? (
                          <Check className="h-4 w-4 text-primary" />
                        ) : atual || precisaAssinatura ? (
                          precisaAssinatura && !concluido ? (
                            <Lock className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )
                        ) : (
                          <Lock className="h-4 w-4" />
                        )}
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-bold text-foreground">
                          Dia {dia.dia} · {treino.nome}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {treino.duracaoMin} min ·{" "}
                          {concluido
                            ? "Concluído"
                            : precisaAssinatura
                              ? "PRO"
                              : atual
                                ? "Hoje"
                                : "Bloqueado"}
                        </span>
                      </span>
                    </div>
                  );

                  return (
                    <li key={key}>
                      {bloqueadoOrdem && !precisaAssinatura ? (
                        inner
                      ) : precisaAssinatura && !concluido ? (
                        <button
                          type="button"
                          className="w-full text-left"
                          onClick={() => {
                            trackMetaCustom("PaywallHit", { from: "plano", semana: semana.semana });
                            void navigate({ to: "/planos", search: { from: "plano" } });
                          }}
                        >
                          {inner}
                        </button>
                      ) : (
                        <Link to="/treino/$treinoId" params={{ treinoId: treino.id }} search={{ plano: key }}>
                          {inner}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
