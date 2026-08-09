import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Pause, Play, SkipBack, SkipForward, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getTreino } from "@/data/training";
import { usePlayer } from "@/lib/player-store";

export const Route = createFileRoute("/treino/$treinoId")({
  validateSearch: (search: Record<string, unknown>): { plano?: string | undefined } => ({
    plano: typeof search["plano"] === "string" ? (search["plano"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Treino em execução — Jogador PRO System" },
      { name: "description", content: "Execute seu treino guiado, exercício por exercício, sem fricção." },
      { property: "og:title", content: "Treino em execução" },
      { property: "og:description", content: "Player guiado com tempo, exercício atual e próximo." },
    ],
  }),
  component: TreinoPage,
});

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function TreinoPage() {
  const { treinoId } = Route.useParams();
  const { plano } = Route.useSearch();
  const navigate = useNavigate();
  const { concluirTreino } = usePlayer();
  const treino = getTreino(treinoId);

  const [idx, setIdx] = useState(0);
  const [restante, setRestante] = useState(treino?.exercicios[0]?.duracaoSeg ?? 0);
  const [rodando, setRodando] = useState(true);
  const [fim, setFim] = useState(false);

  const total = useMemo(() => treino?.exercicios.reduce((a, e) => a + e.duracaoSeg, 0) ?? 0, [treino]);
  const feito = useMemo(
    () => (treino?.exercicios.slice(0, idx).reduce((a, e) => a + e.duracaoSeg, 0) ?? 0) + ((treino?.exercicios[idx]?.duracaoSeg ?? 0) - restante),
    [treino, idx, restante],
  );

  useEffect(() => {
    if (!rodando || fim) return;
    const t = setInterval(() => setRestante((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [rodando, fim]);

  useEffect(() => {
    if (restante > 0 || fim || !treino) return;
    if (idx < treino.exercicios.length - 1) {
      setIdx((i) => i + 1);
      setRestante(treino.exercicios[idx + 1]!.duracaoSeg);
    } else {
      setFim(true);
      setRodando(false);
    }
  }, [restante, idx, fim, treino]);

  if (!treino) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <div>
          <p className="text-foreground">Treino não encontrado.</p>
          <Button asChild className="mt-4">
            <Link to="/">Voltar ao início</Link>
          </Button>
        </div>
      </div>
    );
  }

  const atual = treino.exercicios[idx]!;
  const proximo = treino.exercicios[idx + 1];

  const irPara = (novo: number) => {
    const i = Math.min(Math.max(novo, 0), treino.exercicios.length - 1);
    setIdx(i);
    setRestante(treino.exercicios[i]!.duracaoSeg);
    setFim(false);
  };

  const concluir = () => {
    concluirTreino(treino.id, plano || undefined);
    navigate({ to: "/progresso" });
  };

  if (fim) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/15">
          <Trophy className="h-12 w-12 text-primary" />
        </div>
        <h1 className="mt-6 text-3xl font-extrabold text-foreground">Treino concluído 👊</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {treino.nome} · {treino.duracaoMin} min. Você ficou mais perto do próximo nível.
        </p>
        <Button onClick={concluir} size="lg" className="mt-8 h-14 w-full max-w-sm rounded-2xl text-base font-extrabold">
          <Check className="h-5 w-5" /> Marcar como concluído
        </Button>
        <Button asChild variant="ghost" className="mt-2">
          <Link to="/">Voltar depois</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-md px-5 pb-10 pt-6">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate({ to: "/" })} className="text-muted-foreground" aria-label="Voltar">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-foreground">{treino.nome}</span>
          <span className="text-sm text-muted-foreground">
            {idx + 1}/{treino.exercicios.length}
          </span>
        </div>

        <div className="mt-6 flex aspect-video items-center justify-center rounded-3xl border border-border bg-gradient-to-br from-primary/20 to-card">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Agora</p>
            <p className="mt-2 px-6 text-xl font-extrabold text-foreground">{atual.nome}</p>
            <p className="mt-6 text-6xl font-black tabular-nums text-foreground">{fmt(restante)}</p>
          </div>
        </div>

        <Progress value={Math.round((feito / total) * 100)} className="mt-5" />
        <p className="mt-2 text-center text-xs text-muted-foreground">{atual.dica}</p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <Button variant="secondary" size="icon" className="h-14 w-14 rounded-2xl" onClick={() => irPara(idx - 1)}>
            <SkipBack className="h-5 w-5" />
          </Button>
          <Button size="icon" className="h-20 w-20 rounded-3xl" onClick={() => setRodando((r) => !r)}>
            {rodando ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
          </Button>
          <Button variant="secondary" size="icon" className="h-14 w-14 rounded-2xl" onClick={() => irPara(idx + 1)}>
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {proximo ? `Próximo: ${proximo.nome}` : "Último exercício 🔥"}
        </p>

        <Button variant="outline" className="mt-8 w-full rounded-2xl" onClick={() => setFim(true)}>
          Finalizar treino
        </Button>
      </div>
    </div>
  );
}
