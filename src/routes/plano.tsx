import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, ChevronDown, Eye, Lock, Play } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  FASES_PLANO,
  MESES_PLANO,
  PLANO,
  TOTAL_MESES_PLANO,
  TOTAL_SEMANAS_PLANO,
  getTreino,
  type SemanaPlano,
} from "@/data/training";
import { usePlayer } from "@/lib/player-store";
import { trackMetaCustom } from "@/lib/meta-pixel";
import { cn } from "@/lib/utils";
import { RouteError, RouteNotFound } from "@/components/RouteBoundary";

export const Route = createFileRoute("/plano")({
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
  head: () => ({
    meta: [
      { title: "Jornada guiada de 12 meses — Jogador PRO System" },
      {
        name: "description",
        content:
          "Fundação, domínio, potência e elite: 12 mesociclos de treino guiado, dia a dia, com progressão de carga.",
      },
      { property: "og:title", content: "Jornada guiada de 12 meses" },
      { property: "og:description", content: "Um treino por dia durante um ano, liberado conforme você evolui." },
    ],
  }),
  component: PlanoPage,
});

const CORES_FASE: Record<string, { chip: string; barra: string }> = {
  fundacao: { chip: "bg-emerald-500/15 text-emerald-700", barra: "bg-emerald-500" },
  dominio: { chip: "bg-sky-500/15 text-sky-700", barra: "bg-sky-500" },
  potencia: { chip: "bg-violet-500/15 text-violet-700", barra: "bg-violet-500" },
  elite: { chip: "bg-amber-500/20 text-amber-800", barra: "bg-amber-500" },
};

function PlanoPage() {
  const { planoConcluidos, proximoPlano, state, planoCompleto } = usePlayer();
  const navigate = useNavigate();

  const semanaFeita = (s: SemanaPlano) =>
    s.dias.every((d) => planoConcluidos.includes(`${s.semana}-${d.dia}`));
  const semanasCompletas = PLANO.filter(semanaFeita).length;
  const mesesCompletos = MESES_PLANO.filter((m) => m.semanas.every(semanaFeita)).length;

  const semanaAtiva = proximoPlano && !proximoPlano.manutencao ? proximoPlano.semana : null;
  const mesAtual =
    (semanaAtiva ? PLANO.find((s) => s.semana === semanaAtiva)?.mes : null) ??
    Math.min(mesesCompletos + 1, TOTAL_MESES_PLANO);

  const [aberto, setAberto] = useState<number>(mesAtual);

  return (
    <AppShell
      wide
      title="Meu plano"
      subtitle={planoCompleto ? "Ciclo de manutenção ativo" : "Sua jornada guiada de 12 meses"}
    >
      {planoCompleto ? (
        <div className="mb-6 rounded-[1.5rem] border border-primary/25 bg-primary/10 p-5 shadow-soft">
          <p className="text-sm font-bold text-foreground">Jornada de 12 meses concluída</p>
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-foreground">Jornada de 12 meses</h2>
          <span className="text-xs font-bold text-primary">
            {mesesCompletos}/{TOTAL_MESES_PLANO} meses · {semanasCompletas}/{TOTAL_SEMANAS_PLANO} semanas
          </span>
        </div>
        <div className="mt-3 flex gap-1.5">
          {FASES_PLANO.map((fase) => {
            const semanasFase = PLANO.filter((s) => s.mes >= fase.meses[0] && s.mes <= fase.meses[1]);
            const feitas = semanasFase.filter(semanaFeita).length;
            const pct = Math.round((feitas / semanasFase.length) * 100);
            const cor = CORES_FASE[fase.id]!;
            return (
              <div key={fase.id} className="min-w-0 flex-1">
                <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                  <div className={cn("h-full rounded-full", cor.barra)} style={{ width: `${pct}%` }} />
                </div>
                <p
                  className={cn(
                    "mt-1.5 truncate text-center text-[11px] font-bold",
                    pct > 0 ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {fase.nome}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="space-y-4">
        {MESES_PLANO.map((mes) => {
          const cor = CORES_FASE[mes.fase.id]!;
          const semanasFeitas = mes.semanas.filter(semanaFeita).length;
          const mesFeito = semanasFeitas === mes.semanas.length;
          const expandido = aberto === mes.mes;
          return (
            <section
              key={mes.mes}
              className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card shadow-soft"
            >
              <button
                type="button"
                aria-expanded={expandido}
                onClick={() => setAberto(expandido ? -1 : mes.mes)}
                className="flex w-full items-center gap-3 p-5 text-left sm:p-6"
              >
                <span
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-black",
                    cor.chip,
                  )}
                >
                  M{mes.mes}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-extrabold text-foreground">{mes.titulo}</span>
                    {mes.mes === mesAtual && !planoCompleto ? (
                      <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                        Atual
                      </span>
                    ) : mesFeito ? (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                        Concluído
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {mes.foco} · {semanasFeitas}/{mes.semanas.length} semanas
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                    expandido && "rotate-180",
                  )}
                />
              </button>

              {expandido ? (
                <div className="grid gap-4 border-t border-border/50 p-5 lg:grid-cols-2 lg:gap-5 sm:p-6">
                  {mes.semanas.map((semana) => {
                    const feitos = semana.dias.filter((d) =>
                      planoConcluidos.includes(`${semana.semana}-${d.dia}`),
                    ).length;
                    return (
                      <section
                        key={semana.semana}
                        className="rounded-[1.5rem] border border-border/60 bg-background/70 p-5 shadow-soft"
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={cn(
                              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xs font-black",
                              cor.chip,
                            )}
                          >
                            S{semana.semana}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="text-base font-extrabold text-foreground">{semana.titulo}</h3>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {semana.pilar} · {semana.dias.length} treinos · {feitos}/{semana.dias.length}{" "}
                                  feitos
                                </p>
                              </div>
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">{semana.foco}</p>
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
                            const precisaAssinatura = !state.assinante;
                            const bloqueadoOrdem = !concluido && !atual && !precisaAssinatura;

                            const statusLabel = concluido
                              ? "Concluído"
                              : atual
                                ? "Hoje — próximo passo"
                                : precisaAssinatura
                                  ? `Preview PRO · ${semana.pilar}`
                                  : `Preview · libera depois do dia atual`;

                            const inner = (
                              <div
                                className={cn(
                                  "flex items-center gap-3 rounded-2xl border px-4 py-3",
                                  atual
                                    ? "border-primary/40 bg-primary/10"
                                    : concluido
                                      ? "border-transparent bg-secondary/70"
                                      : "border-border/50 bg-card/80",
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
                                <span className="min-w-0 flex-1">
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
                                      precisaAssinatura || bloqueadoOrdem
                                        ? "text-primary"
                                        : "text-muted-foreground",
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
                                        to: "/checkout",
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
                                  <Link
                                    to="/treino/$treinoId"
                                    params={{ treinoId: treino.id }}
                                    search={{ plano: key }}
                                  >
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
              ) : null}
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
