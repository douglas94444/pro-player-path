import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Clock, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MercadoPagoCheckout } from "@/components/MercadoPagoCheckout";
import { PLANOS_ASSINATURA } from "@/data/training";
import { CAMPANHA } from "@/data/campanha-copy";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer } from "@/lib/player-store";
import { trackMetaDedup } from "@/lib/meta-pixel";
import { cn } from "@/lib/utils";

const CODE_RE = /^[A-Za-z0-9_-]{1,40}$/;
const codigoValido = (v: string) => CODE_RE.test(v);

/** Evento disparado pelos CTAs da landing para abrir o checkout de um plano. */
export const CHECKOUT_EVENT = "jps:checkout";

export function dispararCheckout(plano?: string, iniciar = true) {
  window.dispatchEvent(new CustomEvent(CHECKOUT_EVENT, { detail: { plano, iniciar } }));
}

export function rolarParaOferta() {
  document.getElementById("oferta")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

type Props = {
  planoInicial?: string | undefined;
  refCode?: string | undefined;
  abrirAoMontar?: boolean | undefined;
};

export function CheckoutOferta({ planoInicial, refCode, abrirAoMontar }: Props) {
  const { refreshEntitlement, logado, state, email, hydrated } = usePlayer();
  const navigate = useNavigate();
  const [escolhido, setEscolhido] = useState(planoInicial ?? "semestral");
  const [mostrarBrick, setMostrarBrick] = useState(false);
  const [pendingPix, setPendingPix] = useState(false);
  const [cupomAplicado, setCupomAplicado] = useState<{ code: string; discount: number } | null>(null);

  useEffect(() => {
    if (planoInicial) setEscolhido(planoInicial);
  }, [planoInicial]);

  useEffect(() => {
    if (!refCode || !codigoValido(refCode)) return;
    try {
      sessionStorage.setItem("jogador-pro-affiliate-ref", refCode);
    } catch {
      /* ignore */
    }
    void supabase.from("affiliate_clicks").insert({ code: refCode });
    void (async () => {
      const porCodigo = await supabase
        .from("coupons")
        .select("code, discount_percent")
        .eq("active", true)
        .eq("code", refCode.toUpperCase())
        .maybeSingle();
      let achado = porCodigo.data;
      if (!achado) {
        const porAfiliado = await supabase
          .from("coupons")
          .select("code, discount_percent")
          .eq("active", true)
          .eq("affiliate_code", refCode)
          .limit(1)
          .maybeSingle();
        achado = porAfiliado.data;
      }
      if (achado) {
        setCupomAplicado({ code: achado.code, discount: achado.discount_percent });
      }
    })();
  }, [refCode]);

  const checkoutTrackedRef = useRef(false);
  const abrirBrick = useCallback((plano: string) => {
    if (!checkoutTrackedRef.current) {
      checkoutTrackedRef.current = true;
      trackMetaDedup("InitiateCheckout", {
        content_name: plano,
        currency: "BRL",
        value: (PLANOS_ASSINATURA.find((p) => p.id === plano)?.precoCentavos ?? 0) / 100,
        num_items: 1,
      });
    }
    setMostrarBrick(true);
  }, []);

  const pendenteRef = useRef<string | null>(null);
  const iniciarCheckout = useCallback(
    (plano?: string) => {
      const alvo = plano ?? escolhido;
      setEscolhido(alvo);
      if (!hydrated) {
        // Ainda carregando perfil: guarda a intenção e abre assim que hidratar.
        pendenteRef.current = alvo;
        return;
      }
      if (state.assinante) {
        void navigate({ to: "/app" });
        return;
      }
      if (!logado) {
        void navigate({ to: "/auth", search: { from: "planos", plano: alvo } });
        return;
      }
      abrirBrick(alvo);
    },
    [escolhido, logado, state.assinante, navigate, abrirBrick],
  );

  // CTAs da landing pedem abertura do checkout via evento.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ plano?: string; iniciar?: boolean }>).detail;
      if (detail?.iniciar === false) {
        // Só troca o plano selecionado — nunca fecha um checkout já aberto.
        if (detail.plano) setEscolhido(detail.plano);
        return;
      }
      iniciarCheckout(detail?.plano);
    };
    window.addEventListener(CHECKOUT_EVENT, handler);
    return () => window.removeEventListener(CHECKOUT_EVENT, handler);
  }, [iniciarCheckout]);

  // Retomada pós-login (?checkout=1) — só depois que o perfil hidratou.
  const autoRef = useRef(false);
  useEffect(() => {
    if (abrirAoMontar && hydrated && logado && !state.assinante && !autoRef.current) {
      autoRef.current = true;
      abrirBrick(escolhido);
      rolarParaOferta();
    }
  }, [abrirAoMontar, hydrated, logado, state.assinante, abrirBrick, escolhido]);

  return (
    <div className="mt-8">
      <div className="mx-auto w-full max-w-xl">
        {cupomAplicado ? (
          <p className="mb-3 text-center text-xs font-semibold text-primary">
            {cupomAplicado.code} ativo · {cupomAplicado.discount}% off
          </p>
        ) : null}


        {state.assinante ? (
          <Button asChild size="lg" className="h-14 w-full text-base font-extrabold">
            <Link to="/app">Você já é PRO — ir para o app</Link>
          </Button>
        ) : pendingPix ? (
          <div className="rounded-[1.5rem] border border-primary/30 bg-card p-5 text-center shadow-soft">
            <Clock className="mx-auto h-8 w-8 text-primary" />
            <p className="mt-3 text-base font-extrabold text-foreground">Aguardando confirmação do Pix</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Assim que o Mercado Pago confirmar, seu acesso PRO libera automaticamente.
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
          <>
            <p className="mb-2 text-center text-xs font-semibold text-muted-foreground">
              {CAMPANHA.pagamento}
            </p>
            <Button
              size="lg"
              className="h-14 w-full text-base font-extrabold"
              onClick={() => iniciarCheckout()}
            >
              {CAMPANHA.oferta.cta} — {PLANOS_ASSINATURA.find((p) => p.id === escolhido)?.preco}
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">{CAMPANHA.garantia.curta}</p>
          </>

        ) : (
          <MercadoPagoCheckout
            planoId={escolhido}
            email={email}
            couponCode={cupomAplicado?.code ?? null}
            discountPercent={cupomAplicado?.discount ?? 0}
            onApproved={() => {
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

        <div className="mt-5 flex flex-col items-center gap-1.5 text-center text-xs text-muted-foreground">
          <p className="inline-flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            Pagamento seguro via Mercado Pago
          </p>
          <p>
            {logado
              ? "Checkout transparente (cartão, boleto e Pix). Acesso liberado após aprovação."
              : "Você criará a conta antes do pagamento — e voltamos direto ao checkout."}
          </p>
        </div>
      </div>
    </div>
  );
}
