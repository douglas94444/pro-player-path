import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, Timer } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CATEGORIAS, TREINOS, type Categoria } from "@/data/training";
import { usePlayer } from "@/lib/player-store";
import { trackMetaCustom } from "@/lib/meta-pixel";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/biblioteca")({
  head: () => ({
    meta: [
      { title: "Biblioteca de treinos — Jogador PRO System" },
      {
        name: "description",
        content: "Treinos extras para casa, campo, força, explosão e core. Escolha pelo tempo que você tem.",
      },
      { property: "og:title", content: "Biblioteca de treinos" },
      { property: "og:description", content: "Treinos extras filtrados por local, objetivo e nível." },
    ],
  }),
  component: Biblioteca,
});

function Biblioteca() {
  const [filtro, setFiltro] = useState<Categoria | null>(null);
  const { state } = usePlayer();
  const lista = filtro ? TREINOS.filter((t) => t.categorias.includes(filtro)) : TREINOS;

  return (
    <AppShell title="Biblioteca" subtitle="Treinos extras pra quando quiser mais">
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        <button
          onClick={() => setFiltro(null)}
          className={cn(
            "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
            filtro === null ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground",
          )}
        >
          Todos
        </button>
        {CATEGORIAS.map((c) => (
          <button
            key={c.id}
            onClick={() => setFiltro(c.id)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
              filtro === c.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {lista.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm font-bold text-foreground">Nenhum treino nesta categoria</p>
          <p className="mt-1 text-xs text-muted-foreground">Troque o filtro ou veja todos os treinos.</p>
          <button
            type="button"
            className="mt-4 text-sm font-semibold text-primary underline underline-offset-4"
            onClick={() => setFiltro(null)}
          >
            Limpar filtro
          </button>
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          {lista.map((t) => {
            const bloqueado = t.premium && !state.assinante;
            const card = (
              <div
                className={cn(
                  "rounded-2xl border border-border bg-card p-4 transition-colors",
                  bloqueado ? "opacity-70" : "hover:border-primary/50",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-foreground">{t.nome}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{t.descricao}</p>
                  </div>
                  {bloqueado ? <Lock className="mt-1 h-4 w-4 text-muted-foreground" /> : null}
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Timer className="h-3.5 w-3.5" /> {t.duracaoMin} min
                  <span>·</span>
                  {t.nivel}
                  <span>·</span>
                  {t.categorias.map((c) => CATEGORIAS.find((x) => x.id === c)?.emoji).join(" ")}
                </div>
              </div>
            );

            return bloqueado ? (
              <Link
                key={t.id}
                to="/planos"
                search={{ from: `treino:${t.id}` }}
                onClick={() => trackMetaCustom("PaywallHit", { from: "biblioteca", treino_id: t.id })}
              >
                {card}
              </Link>
            ) : (
              <Link key={t.id} to="/treino/$treinoId" params={{ treinoId: t.id }}>
                {card}
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
