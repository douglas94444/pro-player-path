import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { inicioSemanaBR } from "@/lib/date";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer } from "@/lib/player-store";
import { RouteError, RouteNotFound } from "@/components/RouteBoundary";

export const Route = createFileRoute("/ranking")({
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
  head: () => ({
    meta: [{ title: "Ranking semanal — Jogador PRO System" }],
  }),
  component: RankingPage,
});

type Row = {
  nome: string;
  treinos: number;
  minutos: number;
  streak_peak: number;
};

function weekStartIso() {
  return inicioSemanaBR();
}

function RankingPage() {
  const { state } = usePlayer();
  const week = weekStartIso();
  const { data: rows = [], isError } = useQuery({
    queryKey: ["ranking-semanal", week],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ranking_semanal")
        .select("nome, treinos, minutos, streak_peak")
        .eq("week_start", week)
        .order("posicao", { ascending: true })
        .limit(20);
      if (error) throw error;
      return (data ?? []).map((r) => ({
        nome: r.nome ?? "Jogador",
        treinos: r.treinos ?? 0,
        minutos: r.minutos ?? 0,
        streak_peak: r.streak_peak ?? 0,
      }));
    },
    enabled: state.assinante,
    staleTime: 60_000,
  });

  if (!state.assinante) {
    return (
      <AppShell title="Ranking" subtitle="Liga semanal PRO">
        <div className="rounded-[1.5rem] border border-border/60 bg-card p-6 text-center shadow-soft">
          <Trophy className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Ranking disponível para assinantes.</p>
          <Button asChild className="mt-4 w-full font-extrabold">
            <Link to="/checkout" search={{ from: "ranking" }}>
              Assinar
            </Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Ranking da semana" subtitle="Consistência entre assinantes PRO">
      <ul className="space-y-2">
        {isError ? (
          <li className="rounded-2xl border border-destructive/30 bg-card p-6 text-center text-sm text-destructive">
            Não deu para carregar o ranking. Tente de novo em instantes.
          </li>
        ) : rows.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Ainda sem entradas esta semana. Complete um treino para entrar na liga.
          </li>
        ) : (
          rows.map((r, i) => (
            <li
              key={`${r.nome}-${i}`}
              className="flex items-center justify-between rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-soft"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-black">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">{r.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.treinos} treinos · {r.minutos} min · pico streak {r.streak_peak}
                  </p>
                </div>
              </div>
              {i < 3 ? <Trophy className="h-4 w-4 text-primary" /> : null}
            </li>
          ))
        )}
      </ul>
    </AppShell>
  );
}
