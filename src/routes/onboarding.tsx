import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageFrame } from "@/components/PageFrame";
import { getTreino, PLANO } from "@/data/training";
import { usePlayer } from "@/lib/player-store";
import { trackMetaCustom } from "@/lib/meta-pixel";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Comece em 1 minuto — Jogador PRO System" },
      {
        name: "description",
        content: "Personalize seu plano: nome, objetivo e tempo disponível para treinar.",
      },
    ],
  }),
  component: OnboardingPage,
});

const OBJETIVOS = [
  { id: "base", label: "Construir base física" },
  { id: "controle", label: "Melhorar controle de bola" },
  { id: "explosao", label: "Ganhar explosão" },
  { id: "jogo", label: "Aguentar 90 minutos" },
];

const DISPONIBILIDADE = [
  { id: "10", label: "Até 10 min" },
  { id: "20", label: "10–20 min" },
  { id: "30", label: "20+ min" },
];

const PRIMEIRO = PLANO[0]!.dias[0]!;
const primeiroTreino = getTreino(PRIMEIRO.treinoId)!;

function OnboardingPage() {
  const { completeOnboarding, state, hydrated } = usePlayer();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [nome, setNome] = useState(state.nome === "Jogador" ? "" : state.nome);
  const [objetivo, setObjetivo] = useState("base");
  const [disponibilidade, setDisponibilidade] = useState("20");

  useEffect(() => {
    if (hydrated && state.onboardingDone) {
      void navigate({ to: "/" });
    }
  }, [hydrated, state.onboardingDone, navigate]);

  const next = () => {
    if (step < 2) {
      setStep((s) => s + 1);
      return;
    }
    completeOnboarding({ nome, objetivo, disponibilidade });
    trackMetaCustom("CompleteOnboarding", { objetivo, disponibilidade });
    void navigate({
      to: "/treino/$treinoId",
      params: { treinoId: primeiroTreino.id },
      search: { plano: "1-1" },
    });
  };

  return (
    <PageFrame max="sm" className="justify-center">
      <div className="w-full rounded-[1.75rem] border border-border/60 bg-card p-5 shadow-soft-lg sm:p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Jogador PRO</p>
        <h1 className="mt-2 text-2xl font-extrabold text-foreground sm:text-3xl">
          {step === 0 && "Como podemos te chamar?"}
          {step === 1 && "Qual seu foco agora?"}
          {step === 2 && "Quanto tempo você tem?"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Passo {step + 1} de 3 — menos de 1 minuto.</p>

        <div className="mt-8">
          {step === 0 ? (
            <div>
              <Label htmlFor="nome">Seu nome</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Rafa"
                className="mt-2 h-12"
                autoFocus
              />
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {OBJETIVOS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setObjetivo(o.id)}
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-left text-sm font-semibold",
                    objetivo === o.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-muted-foreground",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          ) : null}

          {step === 2 ? (
            <>
              <div className="grid gap-2 sm:grid-cols-3">
                {DISPONIBILIDADE.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDisponibilidade(d.id)}
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-left text-sm font-semibold sm:text-center",
                      disponibilidade === d.id
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card text-muted-foreground",
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-primary/25 bg-primary/10 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-primary">Seu 1º treino</p>
                <p className="mt-1 text-base font-extrabold text-foreground">{primeiroTreino.nome}</p>
                <p className="mt-1 text-xs text-muted-foreground">{primeiroTreino.descricao}</p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Timer className="h-3.5 w-3.5 text-primary" />
                  {primeiroTreino.duracaoMin} min · Semana 1 · Dia 1
                </p>
              </div>
            </>
          ) : null}
        </div>

        <Button
          size="lg"
          className="mt-8 h-14 w-full text-base font-extrabold"
          disabled={step === 0 && nome.trim().length < 2}
          onClick={next}
        >
          {step === 2 ? "Começar meu 1º treino" : "Continuar"}
        </Button>
      </div>
    </PageFrame>
  );
}
