import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Eye, Lock, Play } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PLANO, getTreino } from "@/data/training";
import { isSemanaPremium } from "@/lib/access";
import { usePlayer } from "@/lib/player-store";
import { trackMetaCustom } from "@/lib/meta-pixel";
import { cn } from "@/lib/utils";
import { RouteError, RouteNotFound } from "@/components/RouteBoundary";

export const Route = createFileRoute("/plano")({
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
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

const JORNADA = [
  { nome: "Base", chip: "bg-emerald-500/15 text-emerald-700", barra: "bg-emerald-500" },
  { nome: "Controle", chip: "bg-sky-500/15 text-sky-700", barra: "bg-sky-500" },
  { nome: "Explosão", chip: "bg-violet-500/15 text-violet-700", barra: "bg-violet-500" },
  { nome: "Performance", chip: "bg-amber-500/20 text-amber-800", barra: "bg-amber-500" },
];


function PlanoPage() {
  const { planoConcluidos, proximoPlano, state, planoCompleto } = usePlayer();
  const navigate = useNavigate();

  return (
    <AppShell
      wide
      title="Meu plano"
      subtitle={planoCompleto ? "Ciclo de manutenção ativo" : "Programas e rotinas que você está fazendo"}
    >
      {planoCompleto ? (
        <div className="mb-6 rounded-[1.5rem] border border-primary/25 bg-primary/10 p-5 shadow-soft">
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

      <section className="mb-5 rounded-[1.5rem] border border-border/60 bg-card p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Campanha de 4 semanas</h2>
          <span className="text-xs font-bold text-primary">
            {semanasCompletas}/{PLANO.length} semanas
          </span>
        </div>
        <div className="mt-3 flex gap-1.5">
          {PLANO.map((s, i) => {
            const etapa = JORNADA[i % JORNADA.length]!;
            const feita = i < semanasCompletas;
            return (
              <div key={s.semana} className="flex-1">
                <div
                  className={cn(
                    "h-2.5 rounded-full transition-colors",
                    feita ? etapa.barra : "bg-secondary",
                  )}
                />
                <p
                  className={cn(
                    "mt-1.5 text-center text-[11px] font-bold",
                    feita ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {etapa.nome}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
        {PLANO.map((semana, si) => {
          const semanaPremium = Boolean(semana.premium) || isSemanaPremium(semana.semana);
          const feitos = semana.dias.filter((d) => planoConcluidos.includes(`${semana.semana}-${d.dia}`)).length;
          const etapa = JORNADA[si % JORNADA.length]!;
          return (
            <section
              key={semana.semana}
              className="rounded-[1.75rem] border border-border/60 bg-card p-5 shadow-soft sm:p-6"
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-black",
                    etapa.chip,
                  )}
                >
                  S{semana.semana}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-extrabold text-foreground">
                        {etapa.nome} · {semana.titulo}
                      </h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Programa · {semana.dias.length} treinos · {feitos}/{semana.dias.length} feitos
                      </p>
                    </div>
                    {semanaPremium ? (
                      <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                        PRO
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground">{semana.foco}</p>
                  {semanaPremium && !state.assinante ? (
                    <p className="mt-1 text-[11px] font-semibold text-primary">
                      O que você ganha: {semana.foco.toLowerCase()}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                {semana.dias.map((dia) => {
                  const key = `${semana.semana}-${dia.dia}`;
                  const concluido = planoConcluidos.includes(key);
                  const atual = proximoPlano?.key === key;
                  const treino = getTreino(dia.treinoId);
                  return (
                    <span
                      key={key}
                      title={`Dia ${dia.dia}: ${treino?.nome ?? ""}`}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold",
                        concluido || atual
                          ? "bg-foreground text-background"
                          : "bg-secondary text-muted-foreground",
                      )}
                    >
                      {dia.dia}
                    </span>
                  );
                })}
              </div>

              <ul className="mt-4 space-y-2">
                {semana.dias.map((dia) => {
                  const key = `${semana.semana}-${dia.dia}`;
                  const treino = getTreino(dia.treinoId)!;
                  const concluido = planoConcluidos.includes(key);
                  const atual = proximoPlano?.key === key;
                  const precisaAssinatura = semanaPremium && !state.assinante;
                  const bloqueadoOrdem = !concluido && !atual && !precisaAssinatura;

                  const statusLabel = concluido
                    ? "Concluído"
                    : atual
                      ? "Hoje — próximo passo"
                      : precisaAssinatura
                        ? `Preview PRO · ${semana.foco}`
                        : `Preview · libera depois do dia atual`;

                  const inner = (
                    <div
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border px-4 py-3",
                        atual
                          ? "border-primary/40 bg-primary/10"
                          : concluido
                            ? "border-transparent bg-secondary/70"
                            : "border-border/50 bg-background/80",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-xl",
                          atual
                            ? "bg-primary text-primary-foreground"
                            : "bg-card text-muted-foreground shadow-soft",
                        )}
                      >
                        {concluido ? (
                          <Check className="h-4 w-4 text-primary" />
                        ) : atual ? (
                          <Play className="h-4 w-4" />
                        ) : precisaAssinatura ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex flex-wrap items-center gap-2 text-sm font-bold text-foreground">
                          Dia {dia.dia} · {treino.nome}
                          {atual ? (
                            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                              Next
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground line-clamp-2">
                          ~{treino.duracaoMin}m · {treino.descricao}
                        </span>
                        <span
                          className={cn(
                            "mt-1 block text-[11px] font-semibold",
                            precisaAssinatura || bloqueadoOrdem ? "text-primary" : "text-muted-foreground",
                          )}
                        >
                          {statusLabel}
                        </span>
                      </span>
                    </div>
                  );

                  return (
                    <li key={key}>
                      {bloqueadoOrdem ? (
                        <div className="opacity-90" aria-label={`Preview do dia ${dia.dia}`}>
                          {inner}
                        </div>
                      ) : precisaAssinatura && !concluido ? (
                        <button
                          type="button"
                          className="w-full text-left"
                          onClick={() => {
                            trackMetaCustom("PaywallHit", { from: "plano", semana: semana.semana });
                            void navigate({
                              to: "/planos",
                              search: {
                                from: "plano",
                                teaser: `${semana.titulo}: ${treino.nome} — ${semana.foco}`,
                              },
                            });
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
