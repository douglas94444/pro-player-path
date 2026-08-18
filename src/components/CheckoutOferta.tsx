import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Clock, Loader2, Shield, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MercadoPagoCheckout } from "@/components/MercadoPagoCheckout";
import { PLANOS_ASSINATURA } from "@/data/training";
import { CAMPANHA } from "@/data/campanha-copy";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer } from "@/lib/player-store";
import { trackMetaDedup } from "@/lib/meta-pixel";
import { cn } from "@/lib/utils";

const CODE_RE = /^[A-Za-z0-9_-]{1,40}$/;
export const codigoValido = (v: string) => CODE_RE.test(v);

/** Evento disparado pelos CTAs da landing para abrir o checkout de um plano. */
export const CHECKOUT_EVENT = "jps:checkout";

export function dispararCheckout(plano?: string, iniciar = true) {
  window.dispatchEvent(new CustomEvent(CHECKOUT_EVENT, { detail: { plano, iniciar } }));
}

export function rolarParaOferta() {
  const alvo = document.getElementById("pagamento") ?? document.getElementById("oferta");
  alvo?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export async function buscarCupomAtivo(codigo: string) {
  const raw = codigo.trim();
  const code = raw.toUpperCase();
  if (!raw) return null;
  const porCodigo = await supabase
    .from("coupons")
    .select("code, discount_percent")
    .eq("active", true)
    .eq("code", code)
    .maybeSingle();
  if (porCodigo.data) return porCodigo.data;
  const porAfiliado = await supabase
    .from("coupons")
    .select("code, discount_percent")
    .eq("active", true)
    .eq("affiliate_code", raw)
    .limit(1)
    .maybeSingle();
  return porAfiliado.data;
}

type Props = {
  planoInicial?: string | undefined;
  refCode?: string | undefined;
  abrirAoMontar?: boolean | undefined;
  variant?: "embed" | "page";
  onPlanoChange?: (plano: string) => void;
  onCupomChange?: (discount: number, code: string | null) => void;
};

export function CheckoutOferta({
  planoInicial,
  refCode,
  abrirAoMontar,
  variant = "embed",
  onPlanoChange,
  onCupomChange,
}: Props) {
  const { refreshEntitlement, logado, state, email, authReady } = usePlayer();
  const navigate = useNavigate();
  const page = variant === "page";
  const [escolhido, setEscolhido] = useState(planoInicial ?? "semestral");
  const [mostrarBrick, setMostrarBrick] = useState(false);
  const [pendingPix, setPendingPix] = useState(false);
  const [cupomAplicado, setCupomAplicado] = useState<{ code: string; discount: number } | null>(null);
  const [cupomDraft, setCupomDraft] = useState("");
  const [cupomErro, setCupomErro] = useState<string | null>(null);
  const [aplicandoCupom, setAplicandoCupom] = useState(false);

  useEffect(() => {
    if (planoInicial) setEscolhido(planoInicial);
  }, [planoInicial]);

  useEffect(() => {
    onPlanoChange?.(escolhido);
  }, [escolhido, onPlanoChange]);

  useEffect(() => {
    onCupomChange?.(cupomAplicado?.discount ?? 0, cupomAplicado?.code ?? null);
  }, [cupomAplicado, onCupomChange]);

  useEffect(() => {
    if (!refCode || !codigoValido(refCode)) return;
    try {
      sessionStorage.setItem("jogador-pro-affiliate-ref", refCode);
    } catch {
      /* ignore */
    }
    void supabase.from("affiliate_clicks").insert({ code: refCode });
    void buscarCupomAtivo(refCode).then((achado) => {
      if (achado) setCupomAplicado({ code: achado.code, discount: achado.discount_percent });
    });
  }, [refCode]);

  const aplicarCupomManual = async () => {
    setCupomErro(null);
    const raw = cupomDraft.trim();
    if (!raw) {
      setCupomErro("Digite um código");
      return;
    }
    setAplicandoCupom(true);
    try {
      const achado = await buscarCupomAtivo(raw);
      if (!achado) {
        setCupomErro("Cupom inválido ou esgotado");
        return;
      }
      setCupomAplicado({ code: achado.code, discount: achado.discount_percent });
      setCupomDraft("");
      toast.success(`${achado.code} aplicado · ${achado.discount}% off`);
    } finally {
      setAplicandoCupom(false);
    }
  };

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
      if (!authReady) {
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
    [escolhido, authReady, logado, state.assinante, navigate, abrirBrick],
  );

  useEffect(() => {
    if (!authReady || !pendenteRef.current) return;
    const alvo = pendenteRef.current;
    pendenteRef.current = null;
    iniciarCheckout(alvo);
  }, [authReady, iniciarCheckout]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ plano?: string; iniciar?: boolean }>).detail;
      if (detail?.iniciar === false) {
        if (detail.plano) setEscolhido(detail.plano);
        return;
      }
      iniciarCheckout(detail?.plano);
    };
    window.addEventListener(CHECKOUT_EVENT, handler);
    return () => window.removeEventListener(CHECKOUT_EVENT, handler);
  }, [iniciarCheckout]);

  const autoRef = useRef(false);
  useEffect(() => {
    if (abrirAoMontar && authReady && logado && !state.assinante && !autoRef.current) {
      autoRef.current = true;
      abrirBrick(escolhido);
      rolarParaOferta();
    }
  }, [abrirAoMontar, authReady, logado, state.assinante, abrirBrick, escolhido]);

  const precoLabel = PLANOS_ASSINATURA.find((p) => p.id === escolhido)?.preco;

  const cupomCampo = (
    <div className={cn("mb-4", page ? "text-left" : "mx-auto max-w-sm")}>
      <label htmlFor="cupom-checkout" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Tag className="h-3.5 w-3.5" />
        Cupom de desconto
      </label>
      <div className="flex gap-2">
        <Input
          id="cupom-checkout"
          value={cupomDraft}
          onChange={(e) => {
            setCupomDraft(e.target.value);
            setCupomErro(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void aplicarCupomManual();
            }
          }}
          placeholder="PRO10"
          autoCapitalize="characters"
          className="h-11 rounded-full bg-background uppercase"
        />
        <Button
          type="button"
          variant="outline"
          className="h-11 shrink-0 px-4"
          disabled={aplicandoCupom}
          onClick={() => void aplicarCupomManual()}
        >
          {aplicandoCupom ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
        </Button>
      </div>
      {cupomAplicado ? (
        <p className="mt-1.5 text-xs font-semibold text-primary">
          {cupomAplicado.code} ativo · {cupomAplicado.discount}% off
        </p>
      ) : null}
      {cupomErro ? <p className="mt-1.5 text-xs text-destructive">{cupomErro}</p> : null}
    </div>
  );

  return (
    <div id="pagamento" className={page ? "scroll-mt-24" : "mt-8"}>
      <div className={cn("w-full", page ? "" : "mx-auto max-w-xl")}>
        {cupomCampo}

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
            <p className={cn("mb-2 text-xs font-semibold text-muted-foreground", !page && "text-center")}>
              {CAMPANHA.pagamento}
            </p>
            <Button
              size="lg"
              disabled={!authReady || pendenteRef.current !== null}
              className="h-14 w-full text-base font-extrabold"
              onClick={() => iniciarCheckout()}
            >
              {!authReady ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparando seu checkout…
                </>
              ) : logado ? (
                <>Pagar com Mercado Pago — {precoLabel}</>
              ) : (
                <>
                  {page ? "Entrar e pagar" : CAMPANHA.oferta.cta} — {precoLabel}
                </>
              )}
            </Button>
            <p className={cn("mt-2 text-xs text-muted-foreground", !page && "text-center")}>
              {CAMPANHA.garantia.curta}
            </p>
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

        {page ? null : (
          <div className="mt-5 flex flex-col items-center gap-1.5 text-center text-xs text-muted-foreground">
            <p className="inline-flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              Pagamento seguro via Mercado Pago
            </p>
            <p>
              {logado
                ? "Checkout transparente (cartão e Pix). Acesso liberado após aprovação."
                : "Você criará a conta antes do pagamento — e voltamos direto ao checkout."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
