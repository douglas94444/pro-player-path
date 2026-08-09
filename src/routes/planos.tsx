import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { MercadoPagoCheckout } from "@/components/MercadoPagoCheckout";
import { BENEFICIOS_PRO, PLANOS_ASSINATURA } from "@/data/training";
import { usePlayer } from "@/lib/player-store";
import { trackMeta, trackMetaCustom } from "@/lib/meta-pixel";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/planos")({
  validateSearch: (search: Record<string, unknown>) => ({
    from: typeof search["from"] === "string" ? (search["from"] as string) : undefined,
    checkout: typeof search["checkout"] === "string" ? (search["checkout"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Planos e assinatura — Jogador PRO System" },
      {
        name: "description",
        content: "Mensal R$47, semestral R$147 ou anual R$197. Destrave semanas 3–4 e a biblioteca premium.",
      },
      { property: "og:title", content: "Comece a treinar como atleta hoje" },
      { property: "og:description", content: "Assine e destrave o plano guiado completo do Jogador PRO System." },
    ],
  }),
  component: PlanosPage,
});

function PlanosPage() {
  const { refreshEntitlement, activateLocalPlan, logado, state, email } = usePlayer();
  const navigate = useNavigate();
  const { from } = Route.useSearch();
  const [escolhido, setEscolhido] = useState("semestral");
  const [mostrarBrick, setMostrarBrick] = useState(false);

  useEffect(() => {
    trackMeta("ViewContent", {
      content_name: "planos",
      content_category: "subscription",
    });
    trackMetaCustom("PaywallHit", { from: from ?? "direct" });
  }, [from]);

  const abrirCheckout = () => {
    if (!logado) {
      void navigate({ to: "/auth", search: { from: "planos", plano: escolhido } });
      return;
    }
    trackMeta("InitiateCheckout", {
      content_name: escolhido,
      currency: "BRL",
      value: (PLANOS_ASSINATURA.find((p) => p.id === escolhido)?.precoCentavos ?? 0) / 100,
      num_items: 1,
    });
    setMostrarBrick(true);
  };

  return (
    <AppShell
      title="Treine no nível PRO"
      subtitle="Menos de R$1,60 por dia no plano anual"
      action={
        <button
          type="button"
          className="text-muted-foreground"
          aria-label="Voltar"
          onClick={() => {
            if (from?.startsWith("treino:")) void navigate({ to: "/biblioteca" });
            else if (from === "soft-paywall" || from === "plano") void navigate({ to: "/plano" });
            else if (from === "perfil") void navigate({ to: "/perfil" });
            else void navigate({ to: "/" });
          }}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      }
    >
      <ul className="mb-6 space-y-2">
        {BENEFICIOS_PRO.map((b) => (
          <li key={b} className="flex items-center gap-2 text-sm text-foreground">
            <Check className="h-4 w-4 text-primary" /> {b}
          </li>
        ))}
      </ul>

      <div className="grid gap-3">
        {PLANOS_ASSINATURA.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setEscolhido(p.id);
              setMostrarBrick(false);
            }}
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

      {state.assinante ? (
        <Button size="lg" className="mt-6 h-14 w-full rounded-2xl text-base font-extrabold" disabled>
          Você já é PRO
        </Button>
      ) : !mostrarBrick ? (
        <Button
          size="lg"
          className="mt-6 h-14 w-full rounded-2xl text-base font-extrabold"
          onClick={abrirCheckout}
        >
          Pagar com Mercado Pago
        </Button>
      ) : (
        <MercadoPagoCheckout
          planoId={escolhido}
          email={email}
          onApproved={(plano) => {
            activateLocalPlan(plano);
            void refreshEntitlement().then(() => {
              toast.success("Acesso PRO liberado");
              void navigate({ to: "/", replace: true });
            });
          }}
          onPending={() => {
            void refreshEntitlement();
          }}
        />
      )}

      <p className="mt-3 text-center text-xs text-muted-foreground">
        {logado
          ? "Checkout transparente Mercado Pago (cartão, boleto e Pix). Acesso liberado após aprovação."
          : "Você precisará entrar na conta antes do checkout."}
      </p>
    </AppShell>
  );
}
