import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MercadoPagoCheckout } from "@/components/MercadoPagoCheckout";
import { BENEFICIOS_PRO, PLANOS_ASSINATURA } from "@/data/training";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer } from "@/lib/player-store";
import { trackMeta, trackMetaCustom } from "@/lib/meta-pixel";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PLANOS_IDS = new Set(PLANOS_ASSINATURA.map((p) => p.id));

export type PlanosSearch = {
  from?: string;
  checkout?: string;
  plano?: string;
  teaser?: string;
  ref?: string;
};

export const Route = createFileRoute("/planos")({
  validateSearch: (search: Record<string, unknown>): PlanosSearch => {
    const out: PlanosSearch = {};
    if (typeof search["from"] === "string") out.from = search["from"];
    if (typeof search["checkout"] === "string") out.checkout = search["checkout"];
    if (typeof search["teaser"] === "string") out.teaser = search["teaser"];
    if (typeof search["ref"] === "string") out.ref = search["ref"];
    if (typeof search["plano"] === "string" && PLANOS_IDS.has(search["plano"])) {
      out.plano = search["plano"];
    }
    return out;
  },
  head: () => ({
    meta: [
      { title: "Planos e assinatura — Jogador PRO System" },
      {
        name: "description",
        content: "Mensal R$47, semestral R$147 ou anual R$197. Acesso completo ao plano guiado.",
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
  const { from, plano, checkout, teaser, ref } = Route.useSearch();
  const [escolhido, setEscolhido] = useState(plano ?? "semestral");
  const [mostrarBrick, setMostrarBrick] = useState(false);
  const [pendingPix, setPendingPix] = useState(false);
  const [cupomInput, setCupomInput] = useState("");
  const [cupomAplicado, setCupomAplicado] = useState<{ code: string; discount: number } | null>(null);
  const [validandoCupom, setValidandoCupom] = useState(false);

  useEffect(() => {
    if (plano) setEscolhido(plano);
  }, [plano]);

  useEffect(() => {
    if (ref) {
      try {
        sessionStorage.setItem("jogador-pro-affiliate-ref", ref);
      } catch {
        /* ignore */
      }
      void supabase.from("affiliate_clicks").insert({ code: ref });
      // Cupom afiliado: code = ref OU affiliate_code = ref
      void supabase
        .from("coupons")
        .select("code, discount_percent")
        .eq("active", true)
        .or(`code.eq.${ref.toUpperCase()},affiliate_code.eq.${ref}`)
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setCupomInput(data.code);
            setCupomAplicado({ code: data.code, discount: data.discount_percent });
          }
        });
    }
  }, [ref]);

  const aplicarCupom = async () => {
    const code = cupomInput.trim().toUpperCase();
    if (!code) {
      toast.message("Digite um cupom");
      return;
    }
    setValidandoCupom(true);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("code, discount_percent, active, max_redemptions, redemptions, affiliate_code")
        .eq("code", code)
        .maybeSingle();
      if (error || !data || !data.active) {
        toast.error("Cupom inválido");
        setCupomAplicado(null);
        return;
      }
      if (data.max_redemptions != null && data.redemptions >= data.max_redemptions) {
        toast.error("Cupom esgotado");
        setCupomAplicado(null);
        return;
      }
      if (data.affiliate_code) {
        try {
          sessionStorage.setItem("jogador-pro-affiliate-ref", data.affiliate_code);
        } catch {
          /* ignore */
        }
      }
      setCupomAplicado({ code: data.code, discount: data.discount_percent });
      setMostrarBrick(false);
      toast.success(`Cupom ${data.code} · −${data.discount_percent}%`);
    } finally {
      setValidandoCupom(false);
    }
  };

  useEffect(() => {
    trackMeta("ViewContent", {
      content_name: "planos",
      content_category: "subscription",
    });
    trackMetaCustom("PaywallHit", { from: from ?? "direct" });
  }, [from]);

  const abrirBrick = () => {
    trackMeta("InitiateCheckout", {
      content_name: escolhido,
      currency: "BRL",
      value: (PLANOS_ASSINATURA.find((p) => p.id === escolhido)?.precoCentavos ?? 0) / 100,
      num_items: 1,
    });
    setMostrarBrick(true);
  };

  useEffect(() => {
    if (checkout === "1" && logado && !state.assinante) {
      trackMeta("InitiateCheckout", {
        content_name: escolhido,
        currency: "BRL",
        value: (PLANOS_ASSINATURA.find((p) => p.id === escolhido)?.precoCentavos ?? 0) / 100,
        num_items: 1,
      });
      setMostrarBrick(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só ao retomar pós-auth
  }, [checkout, logado, state.assinante]);

  const abrirCheckout = () => {
    if (!logado) {
      void navigate({ to: "/auth", search: { from: "planos", plano: escolhido } });
      return;
    }
    abrirBrick();
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
            else if (from === "plano") void navigate({ to: "/plano" });
            else if (from === "perfil") void navigate({ to: "/perfil" });
            else if (from === "progresso") void navigate({ to: "/progresso" });
            else if (from === "campanha") void navigate({ to: "/campanha", search: {} });
            else if (from === "onboarding") void navigate({ to: "/onboarding" });
            else void navigate({ to: "/" });
          }}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      }
    >
      {teaser ? (
        <div className="mb-5 rounded-[1.5rem] border border-primary/30 bg-primary/10 p-4 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-wide text-primary">Assinatura necessária</p>
          <p className="mt-1 text-sm font-extrabold text-foreground">{teaser}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Com PRO você destrava o plano completo, biblioteca e comunidade.
          </p>
        </div>
      ) : null}

      <ul className="mb-5 space-y-2 rounded-[1.5rem] border border-border/60 bg-card p-5 shadow-soft">
        {BENEFICIOS_PRO.map((b) => (
          <li key={b} className="flex items-center gap-2 text-sm text-foreground">
            <Check className="h-4 w-4 text-primary" /> {b}
          </li>
        ))}
      </ul>

      <div className="grid gap-3 md:grid-cols-3">
        {PLANOS_ASSINATURA.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setEscolhido(p.id);
              setMostrarBrick(false);
              setPendingPix(false);
            }}
            className={cn(
              "rounded-[1.5rem] border p-5 text-left shadow-soft transition-colors md:min-h-[140px]",
              escolhido === p.id ? "border-primary bg-primary/10" : "border-border/60 bg-card",
            )}
          >
            <div className="flex items-baseline justify-between gap-2">
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

      <div className="mx-auto mt-6 w-full max-w-xl">
        {!state.assinante ? (
          <div className="mb-4 flex gap-2">
            <Input
              value={cupomInput}
              onChange={(e) => setCupomInput(e.target.value.toUpperCase())}
              placeholder="Cupom (ex. PRO10)"
              className="h-11"
            />
            <Button
              type="button"
              variant="outline"
              className="h-11 shrink-0"
              disabled={validandoCupom}
              onClick={() => void aplicarCupom()}
            >
              Aplicar
            </Button>
          </div>
        ) : null}
        {cupomAplicado ? (
          <p className="mb-3 text-center text-xs font-semibold text-primary">
            {cupomAplicado.code} ativo · {cupomAplicado.discount}% off
          </p>
        ) : null}

        {state.assinante ? (
          <Button size="lg" className="h-14 w-full text-base font-extrabold" disabled>
            Você já é PRO
          </Button>
        ) : pendingPix ? (
          <div className="rounded-[1.5rem] border border-primary/30 bg-card p-5 text-center shadow-soft">
            <Clock className="mx-auto h-8 w-8 text-primary" />
            <p className="mt-3 text-base font-extrabold text-foreground">Aguardando confirmação do Pix</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Assim que o Mercado Pago confirmar, seu acesso PRO libera automaticamente. Pode fechar e voltar em
              alguns minutos.
            </p>
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => {
                void refreshEntitlement().then(() => toast.message("Status atualizado"));
              }}
            >
              Já paguei — atualizar status
            </Button>
          </div>
        ) : !mostrarBrick ? (
          <Button size="lg" className="h-14 w-full text-base font-extrabold" onClick={abrirCheckout}>
            Pagar com Mercado Pago
          </Button>
        ) : (
          <MercadoPagoCheckout
            planoId={escolhido}
            email={email}
            couponCode={cupomAplicado?.code ?? null}
            discountPercent={cupomAplicado?.discount ?? 0}
            onApproved={(planoId) => {
              activateLocalPlan(planoId);
              void refreshEntitlement().then(() => {
                toast.success("Acesso PRO liberado");
                void navigate({ to: "/bem-vindo-pro", replace: true });
              });
            }}
            onPending={() => {
              setPendingPix(true);
              setMostrarBrick(false);
              void refreshEntitlement();
            }}
          />
        )}
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        {logado
          ? "Checkout transparente Mercado Pago (cartão, boleto e Pix). Acesso liberado após aprovação."
          : "Você precisará entrar na conta antes do checkout — e voltamos direto ao pagamento."}
      </p>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Dúvidas? Fale com a gente no Instagram @jogadorprosystem
      </p>
    </AppShell>
  );
}
