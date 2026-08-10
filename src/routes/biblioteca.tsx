import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, Timer } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CATEGORIAS, POSICOES, TREINOS, type Categoria } from "@/data/training";
import { usePlayer } from "@/lib/player-store";
import { categoriaPorObjetivo, labelObjetivo } from "@/lib/recommendations";
import { trackMetaCustom } from "@/lib/meta-pixel";
import { cn } from "@/lib/utils";

type TemporadaFiltro = "todas" | "pre_partida" | "pos_jogo" | "manutencao";

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

const CAT_TINT: Record<Categoria, string> = {
  casa: "from-sky-100 to-sky-50",
  campo: "from-emerald-100 to-emerald-50",
  core: "from-violet-100 to-violet-50",
  explosao: "from-amber-100 to-amber-50",
  forca: "from-lime-100 to-lime-50",
};

function Biblioteca() {
  const { state } = usePlayer();
  const sugerida = categoriaPorObjetivo(state.objetivo);
  const [filtro, setFiltro] = useState<Categoria | null>(null);
  const [posicaoFiltro, setPosicaoFiltro] = useState<string>(state.posicao ?? "qualquer");
  const [temporada, setTemporada] = useState<TemporadaFiltro>("todas");
  const [usouSugestao, setUsouSugestao] = useState(false);

  useEffect(() => {
    if (!usouSugestao && sugerida) {
      setFiltro(sugerida);
      setUsouSugestao(true);
    }
  }, [sugerida, usouSugestao]);

  const lista = TREINOS.filter((t) => {
    if (filtro && !t.categorias.includes(filtro)) return false;
    if (posicaoFiltro && posicaoFiltro !== "qualquer") {
      const ok =
        !t.posicoes?.length ||
        t.posicoes.includes(posicaoFiltro) ||
        t.posicoes.includes("qualquer");
      if (!ok) return false;
    }
    if (temporada !== "todas" && t.temporada !== temporada) return false;
    return true;
  });
  const foco = labelObjetivo(state.objetivo);

  return (
    <AppShell
      wide
      title="Treinos"
      subtitle={foco ? `Sugestão pelo seu foco: ${foco}` : "Biblioteca para quando quiser mais volume"}
    >
      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {POSICOES.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPosicaoFiltro(p.id)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-soft",
              posicaoFiltro === p.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/60 bg-card text-muted-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {(
          [
            ["todas", "Temporada"],
            ["pre_partida", "Pré-partida"],
            ["pos_jogo", "Pós-jogo"],
            ["manutencao", "Manutenção"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTemporada(id)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-soft",
              temporada === id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/60 bg-card text-muted-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        <button
          onClick={() => setFiltro(null)}
          className={cn(
            "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold shadow-soft transition-colors",
            filtro === null
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border/60 bg-card text-muted-foreground",
          )}
        >
          Todos
        </button>
        {sugerida ? (
          <button
            onClick={() => setFiltro(sugerida)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold shadow-soft transition-colors",
              filtro === sugerida
                ? "border-primary bg-primary text-primary-foreground"
                : "border-primary/40 bg-primary/10 text-primary",
            )}
          >
            Pra você
          </button>
        ) : null}
        {CATEGORIAS.map((c) => (
          <button
            key={c.id}
            onClick={() => setFiltro(c.id)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold shadow-soft transition-colors",
              filtro === c.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border/60 bg-card text-muted-foreground",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {lista.length === 0 ? (
        <div className="mt-10 rounded-[1.5rem] border border-dashed border-border bg-card p-8 text-center shadow-soft">
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
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map((t) => {
            const bloqueado = !state.assinante;
            const tint = CAT_TINT[t.categorias[0] ?? "casa"];
            const card = (
              <div
                className={cn(
                  "overflow-hidden rounded-[1.5rem] border border-border/60 bg-card shadow-soft transition-transform hover:-translate-y-0.5",
                  bloqueado && "opacity-90",
                )}
              >
                <div className={cn("relative h-28 bg-gradient-to-br px-4 pt-4", tint)}>
                  <p className="text-sm font-extrabold text-foreground">{t.nome}</p>
                  {bloqueado ? (
                    <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-card/90 shadow-soft">
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                  ) : null}
                </div>
                <div className="p-4">
                  <p className="line-clamp-2 text-xs text-muted-foreground">{t.descricao}</p>
                  {bloqueado ? (
                    <p className="mt-2 text-[11px] font-semibold text-primary">PRO · destrava com a assinatura</p>
                  ) : null}
                  <div className="mt-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Timer className="h-3.5 w-3.5" /> {t.duracaoMin} min
                    <span>·</span>
                    {t.nivel}
                  </div>
                </div>
              </div>
            );

            return bloqueado ? (
              <Link
                key={t.id}
                to="/planos"
                search={{
                  from: `treino:${t.id}`,
                  teaser: `${t.nome} — ${t.descricao}`,
                }}
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
