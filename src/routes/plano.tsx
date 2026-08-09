import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Lock, Play } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PLANO, getTreino } from "@/data/training";
import { usePlayer } from "@/lib/player-store";
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
  const { planoConcluidos, proximoPlano } = usePlayer();

  return (
    <AppShell title="Plano guiado" subtitle="Um caminho só: siga os dias em ordem">
      <div className="space-y-6">
        {PLANO.map((semana) => (
          <section key={semana.semana} className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg font-extrabold text-foreground">{semana.titulo}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{semana.foco}</p>
            <ul className="mt-4 space-y-2">
              {semana.dias.map((dia) => {
                const key = `${semana.semana}-${dia.dia}`;
                const treino = getTreino(dia.treinoId)!;
                const concluido = planoConcluidos.includes(key);
                const atual = proximoPlano?.key === key;
                const bloqueado = !concluido && !atual;

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
                      ) : atual ? (
                        <Play className="h-4 w-4" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-bold text-foreground">
                        Dia {dia.dia} · {treino.nome}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {treino.duracaoMin} min · {concluido ? "Concluído" : atual ? "Hoje" : "Bloqueado"}
                      </span>
                    </span>
                  </div>
                );

                return (
                  <li key={key}>
                    {bloqueado ? (
                      inner
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
        ))}
      </div>
    </AppShell>
  );
}
