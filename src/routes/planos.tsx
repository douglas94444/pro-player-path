import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { PLANOS_ASSINATURA } from "@/data/training";
import { usePlayer } from "@/lib/player-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/planos")({
  head: () => ({
    meta: [
      { title: "Planos e assinatura — Jogador PRO System" },
      {
        name: "description",
        content: "Mensal R$47, semestral R$147 ou anual R$197. Libere todos os treinos e o plano guiado completo.",
      },
      { property: "og:title", content: "Comece a treinar como atleta hoje" },
      { property: "og:description", content: "Assine e destrave o plano guiado completo do Jogador PRO System." },
    ],
  }),
  component: PlanosPage,
});

const beneficios = [
  "Plano guiado completo de 4 semanas",
  "Biblioteca com todos os treinos",
  "Modo Rápido de 10 minutos",
  "Streak, níveis e conquistas",
];

function PlanosPage() {
  const { assinar } = usePlayer();
  const navigate = useNavigate();
  const [escolhido, setEscolhido] = useState("semestral");

  return (
    <AppShell title="Comece a treinar como atleta hoje" subtitle="Menos de R$1,60 por dia no plano anual">
      <ul className="mb-6 space-y-2">
        {beneficios.map((b) => (
          <li key={b} className="flex items-center gap-2 text-sm text-foreground">
            <Check className="h-4 w-4 text-primary" /> {b}
          </li>
        ))}
      </ul>

      <div className="grid gap-3">
        {PLANOS_ASSINATURA.map((p) => (
          <button
            key={p.id}
            onClick={() => setEscolhido(p.id)}
            className={cn(
              "rounded-2xl border p-4 text-left transition-colors",
              escolhido === p.id ? "border-primary bg-primary/10" : "border-border bg-card",
            )}
          >
            <div className="flex items-baseline justify-between">
              <span className="text-base font-extrabold text-foreground">{p.nome}</span>
              <span className="text-xl font-black text-foreground">
                {p.preco}
                <span className="text-xs font-medium text-muted-foreground">{p.periodo}</span>
              </span>
            </div>
            <p className={cn("mt-1 text-xs", p.destaque ? "font-bold text-primary" : "text-muted-foreground")}>
              {p.nota}
            </p>
          </button>
        ))}
      </div>

      <Button
        size="lg"
        className="mt-6 h-14 w-full rounded-2xl text-base font-extrabold"
        onClick={() => {
          assinar(escolhido);
          navigate({ to: "/" });
        }}
      >
        Liberar acesso agora
      </Button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Pagamento simulado nesta versão de demonstração.
      </p>
    </AppShell>
  );
}
