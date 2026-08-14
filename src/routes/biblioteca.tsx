import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RouteError, RouteNotFound } from "@/components/RouteBoundary";
import { TreinoCard } from "@/components/TreinoCard";

import { CATEGORIAS, POSICOES, TREINOS, type Categoria } from "@/data/training";
import { usePlayer } from "@/lib/player-store";
import { categoriaPorObjetivo, labelObjetivo } from "@/lib/recommendations";
import { trackMetaCustom } from "@/lib/meta-pixel";
import { cn } from "@/lib/utils";

type TemporadaFiltro = "todas" | "pre_partida" | "pos_jogo" | "manutencao";
type Ordem = "relevancia" | "duracao" | "intensidade" | "feitos";

const ORDENS: [Ordem, string][] = [
  ["relevancia", "Recomendado"],
  ["duracao", "Menor duração"],
  ["intensidade", "Mais intenso"],
  ["feitos", "Mais feitos"],
];

const PESO_NIVEL: Record<string, number> = { Iniciante: 1, "Intermediário": 2, "Avançado": 3, PRO: 4 };

export const Route = createFileRoute("/biblioteca")({
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
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
  const { state } = usePlayer();
  const sugerida = categoriaPorObjetivo(state.objetivo);
  const [filtro, setFiltro] = useState<Categoria | null>(null);
  const [posicaoFiltro, setPosicaoFiltro] = useState<string>(state.posicao ?? "qualquer");
  const [temporada, setTemporada] = useState<TemporadaFiltro>("todas");
  const [usouSugestao, setUsouSugestao] = useState(false);
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("relevancia");

  useEffect(() => {
    if (!usouSugestao && sugerida) {
      setFiltro(sugerida);
      setUsouSugestao(true);
    }
  }, [sugerida, usouSugestao]);

  const termo = busca.trim().toLowerCase();
  const feitosPorTreino = state.sessoes.reduce<Record<string, number>>((acc, s) => {
    acc[s.treinoId] = (acc[s.treinoId] ?? 0) + 1;
    return acc;
  }, {});
  const lista = TREINOS.filter((t) => {
    if (termo) {
      const alvo = [t.nome, t.descricao, ...t.exercicios.map((e) => e.nome)].join(" ").toLowerCase();
      if (!alvo.includes(termo)) return false;
    }
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
  }).sort((a, b) => {
    if (ordem === "duracao") return a.duracaoMin - b.duracaoMin;
    if (ordem === "intensidade") return (PESO_NIVEL[b.nivel] ?? 0) - (PESO_NIVEL[a.nivel] ?? 0);
    if (ordem === "feitos") return (feitosPorTreino[b.id] ?? 0) - (feitosPorTreino[a.id] ?? 0);
    return 0;
  });
  const foco = labelObjetivo(state.objetivo);

  return (
    <AppShell
      wide
      title="Treinos"
      subtitle={foco ? `Sugestão pelo seu foco: ${foco}` : "Biblioteca para quando quiser mais volume"}
    >
      <div className="mb-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar treino ou exercício"
            aria-label="Buscar treino ou exercício"
            className="h-11 w-full rounded-full border border-border/60 bg-card pl-9 pr-4 text-sm text-foreground shadow-soft outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </div>
      </div>
      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {ORDENS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setOrdem(id)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-soft",
              ordem === id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/60 bg-card text-muted-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>
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
          <p className="text-sm font-bold text-foreground">Nenhum treino encontrado</p>
          <p className="mt-1 text-xs text-muted-foreground">Troque a busca ou os filtros para ver mais treinos.</p>
          <button
            type="button"
            className="mt-4 text-sm font-semibold text-primary underline underline-offset-4"
            onClick={() => {
              setBusca("");
              setOrdem("relevancia");
              setFiltro(null);
              setPosicaoFiltro("qualquer");
              setTemporada("todas");
            }}
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map((t) => {
            const bloqueado = !state.assinante;
            return bloqueado ? (
              <Link
                key={t.id}
                to="/planos"
                search={{
                  from: `treino:${t.id}`,
                  teaser: `${t.nome} — ${t.descricao}`,
                }}
                onClick={() => trackMetaCustom("PaywallHit", { from: "biblioteca", treino_id: t.id })}
                className="block h-full"
              >
                <TreinoCard treino={t} bloqueado legenda="Destrave no PRO" />
              </Link>
            ) : (
              <TreinoCard key={t.id} treino={t} />
            );
          })}
        </div>
      )}

    </AppShell>
  );
}
