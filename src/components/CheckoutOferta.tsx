import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { sincronizarPagamento } from "@/lib/pagamento.functions";
import { Clock, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckoutAuth, type CheckoutDados } from "@/components/CheckoutAuth";
import { MercadoPagoCheckout } from "@/components/MercadoPagoCheckout";
import { PLANOS_ASSINATURA } from "@/data/training";
import { CAMPANHA } from "@/data/campanha-copy";
import { supabase } from "@/integrations/supabase/client";
import { PLANO_PADRAO, registrarCheckoutIntent } from "@/lib/checkout";
import { cpfValido, phoneValido } from "@/lib/br-docs";
import { usePlayer } from "@/lib/player-store";
import { trackMetaDedup } from "@/lib/meta-pixel";
import { cn } from "@/lib/utils";

const CODE_RE = /^[A-Za-z0-9_-]{1,40}$/;
export const codigoValido = (v: string) => CODE_RE.test(v);

const PIX_PENDING_KEY = "jogador-pro-pix-pending";
const PIX_POLL_MS = 4000;
const PIX_POLL_MAX_MS = 20 * 60 * 1000;

/** Evento disparado pelos CTAs da landing para destacar um plano. */
export const CHECKOUT_EVENT = "jps:checkout";

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

export type CheckoutSlots = {
  dados: ReactNode;
  pagamento: ReactNode;
  cupom: ReactNode;
  cta: ReactNode;
  desconto: number;
  cupomCode: string | null;
};

type Props = {
  planoInicial?: string | undefined;
  refCode?: string | undefined;
  abrirAoMontar?: boolean | undefined;
  onPlanoChange?: (plano: string) => void;
  onCupomChange?: (discount: number, code: string | null) => void;
  children?: (slots: CheckoutSlots) => ReactNode;
};

export function CheckoutOferta({
  planoInicial,
  refCode,
  abrirAoMontar,
  onPlanoChange,
  onCupomChange,
  children,
}: Props) {
  const { refreshEntitlement, logado, state, email, authReady } = usePlayer();
  const navigate = useNavigate();
  const sincronizarMp = useServerFn(sincronizarPagamento);
  const [verificando, setVerificando] = useState(false);
  const page = true;
  const [escolhido, setEscolhido] = useState(planoInicial ?? PLANO_PADRAO);
  const [mostrarBrick, setMostrarBrick] = useState(false);
  const [pendingPix, setPendingPix] = useState(() => {
    try {
      return sessionStorage.getItem(PIX_PENDING_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [cupomAplicado, setCupomAplicado] = useState<{ code: string; discount: number } | null>(null);
  const [docs, setDocs] = useState<{ cpf: string | null; phone: string | null } | null>(null);
  const docsProntos = !logado || docs !== null;

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
    if (!logado) {
      setDocs(null);
      return;
    }
    let cancel = false;
    const carregarDocs = async () => {
      try {
        const consulta = supabase.auth.getUser().then(async ({ data }) => {
          const id = data.user?.id;
          if (!id) return { cpf: null, phone: null };
          const { data: perfil } = await supabase.from("profiles").select("cpf, phone").eq("id", id).maybeSingle();
          return { cpf: perfil?.cpf ?? null, phone: perfil?.phone ?? null };
        });
        const limite = new Promise<{ cpf: null; phone: null }>((resolve) => {
          window.setTimeout(() => resolve({ cpf: null, phone: null }), 8000);
        });
        const perfilDocs = await Promise.race([consulta, limite]);
        if (!cancel) setDocs(perfilDocs);
      } catch {
        if (!cancel) setDocs({ cpf: null, phone: null });
      }
    };
    void carregarDocs();
    return () => {
      cancel = true;
    };
  }, [logado]);

  useEffect(() => {
    if (!refCode || !codigoValido(refCode)) return;
    try {
      sessionStorage.setItem("jogador-pro-affiliate-ref", refCode);
    } catch {
      /* ignore */
    }
    void import("@/lib/leads.functions").then(({ registrarAffiliateClick }) =>
      registrarAffiliateClick({ data: { code: refCode } }).catch(() => {}),
    );
    void buscarCupomAtivo(refCode).then((achado) => {
      if (achado) setCupomAplicado({ code: achado.code, discount: achado.discount_percent });
    });
  }, [refCode]);

  const marcarPixPendente = useCallback((ativo: boolean) => {
    setPendingPix(ativo);
    try {
      if (ativo) sessionStorage.setItem(PIX_PENDING_KEY, "1");
      else sessionStorage.removeItem(PIX_PENDING_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const irParaPro = useCallback(() => {
    marcarPixPendente(false);
    toast.success("Acesso PRO liberado");
    void navigate({ to: "/bem-vindo-pro", replace: true });
  }, [marcarPixPendente, navigate]);

  /** Consulta o Mercado Pago e libera o acesso se o pagamento já estiver aprovado. */
  const verificarPagamento = useCallback(
    async (manual = false) => {
      if (manual) setVerificando(true);
      try {
        const res = await sincronizarMp({ data: undefined }).catch(() => null);
        await refreshEntitlement();
        if (res?.assinante) {
          irParaPro();
          return true;
        }
        if (manual) {
          const st = res?.status;
          if (st === "pending" || st === "in_process" || st === "not_found" || !st) {
            toast.message("Pagamento ainda não confirmado", {
              description: "Se você já pagou, aguarde alguns segundos — liberamos automaticamente.",
            });
          } else if (st === "rejected" || st === "cancelled") {
            toast.error("Pagamento não aprovado", { description: "Tente novamente com outro método." });
          } else {
            toast.message("Status atualizado");
          }
        }
        return false;
      } finally {
        if (manual) setVerificando(false);
      }
    },
    [sincronizarMp, refreshEntitlement, irParaPro],
  );



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
    void registrarCheckoutIntent(plano).catch(() => {
      toast.message("Não deu para registrar o checkout", { description: "Você ainda pode pagar normalmente." });
    });
  }, []);

  const precisaDocs = Boolean(
    logado && docs && (!cpfValido(docs.cpf ?? "") || !phoneValido(docs.phone ?? "")),
  );

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
      if (!logado || precisaDocs) {
        document.getElementById("checkout-dados")?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      abrirBrick(alvo);
    },
    [escolhido, authReady, logado, precisaDocs, state.assinante, navigate, abrirBrick],
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
    if (
      (abrirAoMontar || logado) &&
      authReady &&
      logado &&
      !state.assinante &&
      docsProntos &&
      !precisaDocs &&
      !autoRef.current
    ) {
      autoRef.current = true;
      abrirBrick(escolhido);
      rolarParaOferta();
    }
  }, [abrirAoMontar, authReady, logado, state.assinante, docsProntos, precisaDocs, abrirBrick, escolhido]);

  useEffect(() => {
    if (!pendingPix || !logado || state.assinante) return;
    const iniciado = Date.now();
    const poll = () => {
      if (Date.now() - iniciado > PIX_POLL_MAX_MS) return;
      void verificarPagamento();
    };
    poll();
    const id = window.setInterval(poll, PIX_POLL_MS);
    const onVisivel = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVisivel);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisivel);
    };
  }, [pendingPix, logado, state.assinante, verificarPagamento]);

  useEffect(() => {
    if (pendingPix && state.assinante) irParaPro();
  }, [pendingPix, state.assinante, irParaPro]);

  const precoLabel = PLANOS_ASSINATURA.find((p) => p.id === escolhido)?.preco;

  const onDados = (dados: CheckoutDados) => {
    setDocs({ cpf: dados.cpf, phone: dados.phone });
  };

  const pixBanner = pendingPix ? (
    <div className="mb-4 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-center">
      <Clock className="mx-auto h-6 w-6 text-primary" />
      <p className="mt-2 text-sm font-extrabold text-foreground">Aguardando o Pix</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Mantenha o QR ou o código visível. Confirmamos sozinhos em alguns segundos.
      </p>
      <Button
        variant="outline"
        size="sm"
        className="mt-3"
        disabled={verificando}
        onClick={() => {
          void verificarPagamento(true);
        }}
      >
        {verificando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {verificando ? "Verificando…" : "Já paguei — atualizar agora"}
      </Button>
    </div>
  ) : null;

  const authBlock = (
    <CheckoutAuth
      plano={escolhido}
      hideSubmit={page}
      formId="checkout-dados"
      inicial={logado && precisaDocs ? "completar" : "cadastro"}
      onDados={onDados}
      onAuthenticated={() => {
        abrirBrick(escolhido);
        rolarParaOferta();
      }}
    />
  );

  const dados: ReactNode =
    state.assinante ? (
      <p className="text-sm text-muted-foreground">Sua assinatura PRO já está ativa.</p>
    ) : !logado || precisaDocs ? (
      authBlock
    ) : (
      <p className="text-sm text-muted-foreground">
        Logado como <span className="font-semibold text-foreground">{email}</span>
      </p>
    );

  const podePagar = logado && !precisaDocs && docsProntos;

  const pagamento: ReactNode = state.assinante ? (
    <Button asChild size="lg" className="h-12 w-full font-extrabold">
      <Link to="/app">Ir para o app</Link>
    </Button>
  ) : mostrarBrick || pendingPix || podePagar ? (
    <>
      {pixBanner}
      <MercadoPagoCheckout
        planoId={escolhido}
        email={email}
        cpf={docs?.cpf ?? null}
        couponCode={cupomAplicado?.code ?? null}
        discountPercent={cupomAplicado?.discount ?? 0}
        onApproved={() => {
          void refreshEntitlement().then(() => irParaPro());
        }}
        onPending={() => {
          marcarPixPendente(true);
          void refreshEntitlement();
        }}
      />
    </>
  ) : !authReady ? (
    <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> Preparando Pix e cartão…
    </p>
  ) : (
    <p className="text-sm text-muted-foreground">
      Preencha seus dados e clique em <span className="font-semibold text-foreground">Finalizar pedido</span> para
      liberar Pix e cartão.
    </p>
  );


  const cta: ReactNode = state.assinante ? (
    <Button asChild size="lg" className="h-14 w-full text-base font-extrabold">
      <Link to="/app">Você já é PRO — ir para o app</Link>
    </Button>
  ) : !logado || precisaDocs ? (
    <Button type="submit" form="checkout-dados" size="lg" className="h-14 w-full text-base font-extrabold">
      Finalizar pedido
    </Button>
  ) : mostrarBrick || pendingPix ? (
    <Button
      type="button"
      size="lg"
      variant="outline"
      className="h-14 w-full text-base font-extrabold"
      onClick={() => document.getElementById("pagamento")?.scrollIntoView({ behavior: "smooth", block: "start" })}
    >
      Conclua o pagamento ao lado
    </Button>
  ) : (
    <Button
      type="button"
      size="lg"
      disabled={!authReady}
      className="h-14 w-full text-base font-extrabold"
      onClick={() => iniciarCheckout()}
    >
      {!authReady ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparando seu checkout…
        </>
      ) : (
        <>Finalizar pedido — {precoLabel}</>
      )}
    </Button>
  );

  if (children) {
    return (
      <>
        {children({
          dados,
          pagamento,
          cupom: null,
          cta,
          desconto: cupomAplicado?.discount ?? 0,
          cupomCode: cupomAplicado?.code ?? null,
        })}
      </>
    );
  }

  return (
    <div id="pagamento" className={page ? "scroll-mt-24" : "mt-8"}>
      <div className={cn("w-full", page ? "" : "mx-auto max-w-xl")}>
        {state.assinante ? (
          <Button asChild size="lg" className="h-14 w-full text-base font-extrabold">
            <Link to="/app">Você já é PRO — ir para o app</Link>
          </Button>
        ) : !logado || precisaDocs ? (
          authBlock
        ) : mostrarBrick || pendingPix || podePagar ? (
          <>
            {pixBanner}
            <MercadoPagoCheckout
              planoId={escolhido}
              email={email}
              cpf={docs?.cpf ?? null}
              couponCode={cupomAplicado?.code ?? null}
              discountPercent={cupomAplicado?.discount ?? 0}
              onApproved={() => {
                void refreshEntitlement().then(() => irParaPro());
              }}
              onPending={() => {
                marcarPixPendente(true);
                void refreshEntitlement();
              }}
            />
          </>
        ) : (
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
              ) : (
                <>{CAMPANHA.oferta.cta} — {precoLabel}</>
              )}
            </Button>
            <p className={cn("mt-2 text-xs text-muted-foreground", !page && "text-center")}>
              {CAMPANHA.garantia.curta}
            </p>
          </>
        )}

        {page ? null : (
          <div className="mt-5 flex flex-col items-center gap-1.5 text-center text-xs text-muted-foreground">
            <p className="inline-flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              Pagamento seguro · Pix ou cartão
            </p>
            <p>
              {logado
                ? "Checkout transparente (cartão e Pix). Acesso liberado após aprovação."
                : "Crie a conta aqui mesmo — o pagamento abre em seguida."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
