import { Link } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type RankingRow = {
  nome: string;
  treinos: number;
  minutos: number;
  streak_peak: number;
  posicao: number;
};

export function RankingLista({
  rows,
  meuNome,
  emptyCta,
}: {
  rows: RankingRow[];
  meuNome?: string;
  emptyCta?: { to: "/treino/$treinoId"; params: { treinoId: string }; search: { plano: string }; label: string } | null;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">Ainda sem entradas esta semana. Complete um treino para entrar na liga.</p>
        {emptyCta ? (
          <Button asChild className="mt-4 w-full font-extrabold">
            <Link to={emptyCta.to} params={emptyCta.params} search={emptyCta.search}>
              {emptyCta.label}
            </Link>
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {rows.map((r) => {
        const eu = Boolean(meuNome && r.nome === meuNome);
        return (
          <li
            key={`${r.posicao}-${r.nome}`}
            className={cn(
              "flex items-center justify-between rounded-2xl border px-4 py-3 shadow-soft",
              eu ? "border-primary/40 bg-primary/10" : "border-border/60 bg-card",
            )}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-black">
                {r.posicao}
              </span>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {r.nome}
                  {eu ? " · você" : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.treinos} treinos · {r.minutos} min · pico streak {r.streak_peak}
                </p>
              </div>
            </div>
            {r.posicao <= 3 ? <Trophy className="h-4 w-4 text-primary" /> : null}
          </li>
        );
      })}
    </ul>
  );
}
