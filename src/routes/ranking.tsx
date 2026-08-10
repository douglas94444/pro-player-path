import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer } from "@/lib/player-store";

export const Route = createFileRoute("/ranking")({
  head: () => ({
    meta: [{ title: "Ranking semanal — Jogador PRO System" }],
  }),
  component: RankingPage,
});

type Row = {
  user_id: string;
  treinos: number;
  minutos: number;
  streak_peak: number;
  profiles?: { nome: string } | null;
};

function weekStartIso() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function RankingPage() {
  const { state } = usePlayer();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    const week = weekStartIso();
    void supabase
      .from("league_entries")
      .select("user_id, treinos, minutos, streak_peak")
      .eq("week_start", week)
      .order("treinos", { ascending: false })
      .limit(20)
      .then(async ({ data }) => {
        const list = (data ?? []) as Row[];
        const ids = list.map((r) => r.user_id);
        if (!ids.length) {
          setRows([]);
          return;
        }
        const { data: profiles } = await supabase.from("profiles").select("id, nome").in("id", ids);
        const map = new Map((profiles ?? []).map((p) => [p.id, p.nome]));
        setRows(list.map((r) => ({ ...r, profiles: { nome: map.get(r.user_id) ?? "Jogador" } })));
      });
  }, []);

  if (!state.assinante) {
    return (
      <AppShell title="Ranking" subtitle="Liga semanal PRO">
        <div className="rounded-[1.5rem] border border-border/60 bg-card p-6 text-center shadow-soft">
          <Trophy className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Ranking disponível para assinantes.</p>
          <Button asChild className="mt-4 w-full font-extrabold">
            <Link to="/planos" search={{ from: "ranking" }}>
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
        {rows.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Ainda sem entradas esta semana. Complete um treino para entrar na liga.
          </li>
        ) : (
          rows.map((r, i) => (
            <li
              key={r.user_id}
              className="flex items-center justify-between rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-soft"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-black">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">{r.profiles?.nome ?? "Jogador"}</p>
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
