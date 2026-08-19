import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import { PLANOS_ASSINATURA } from "@/data/training";
import { supabase } from "@/integrations/supabase/client";
import { getFbc, trackMeta, trackMetaDedup } from "@/lib/meta-pixel";
import { getStoredUtm } from "@/lib/utm";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const PIX_QR_KEY = "jogador-pro-pix-qr";

type PixQr = {
  qr_code: string | null;
  qr_code_base64: string | null;
  ticket_url: string | null;
};

function lerPixQr(): PixQr | null {
  try {
    const raw = sessionStorage.getItem(PIX_QR_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PixQr;
    if (!parsed?.qr_code && !parsed?.qr_code_base64) return null;
    return parsed;
  } catch {
    return null;
  }
}

function gravarPixQr(qr: PixQr | null) {
  try {
    if (qr) sessionStorage.setItem(PIX_QR_KEY, JSON.stringify(qr));
    else sessionStorage.removeItem(PIX_QR_KEY);
  } catch {
    /* ignore */
  }
}

type Props = {
  planoId: string;
  email?: string | null;
  cpf?: string | null;
  couponCode?: string | null;
  discountPercent?: number;
  onApproved: (plano: string) => void;
  onPending?: () => void;
};

type MpSdk = typeof import("@mercadopago/sdk-react");
type PaymentBrickProps = React.ComponentProps<MpSdk["Payment"]>;

function novoId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? `paymentBrick_${crypto.randomUUID()}`
    : `paymentBrick_${Date.now()}`;
}

export function MercadoPagoCheckout({
  planoId,
  email,
  cpf,
  couponCode,
  discountPercent = 0,
  onApproved,
  onPending,
}: Props) {
  const publicKey = import.meta.env["VITE_MERCADOPAGO_PUBLIC_KEY"] as string | undefined;
  const [noCliente, setNoCliente] = useState(false);
  const [Brick, setBrick] = useState<ComponentType<PaymentBrickProps> | null>(null);
  const [brickId, setBrickId] = useState(novoId);
  const [pronto, setPronto] = useState(false);
  const [erroBrick, setErroBrick] = useState<string | null>(null);
  const [pixQr, setPixQr] = useState<PixQr | null>(null);
  const [copiado, setCopiado] = useState(false);
  const intentKeyRef = useRef(
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `mp-${Date.now()}`,
  );
  const onApprovedRef = useRef(onApproved);
  const onPendingRef = useRef(onPending);
  onApprovedRef.current = onApproved;
  onPendingRef.current = onPending;

  const plano = useMemo(() => PLANOS_ASSINATURA.find((p) => p.id === planoId), [planoId]);
  const baseAmount = (plano?.precoCentavos ?? 0) / 100;
  const amount = Math.max(
    1,
    Math.round(baseAmount * (1 - Math.min(50, Math.max(0, discountPercent)) / 100) * 100) / 100,
  );

  useEffect(() => {
    setNoCliente(true);
    setPixQr(lerPixQr());
  }, []);

  useEffect(() => {
    if (!noCliente || !publicKey || pixQr) return;
    let vivo = true;
    void import("@mercadopago/sdk-react")
      .then((mod) => {
        if (!vivo) return;
        mod.initMercadoPago(publicKey, { locale: "pt-BR" });
        setBrick(() => mod.Payment);
      })
      .catch((err) => {
        if (vivo) setErroBrick(err instanceof Error ? err.message : "Não foi possível carregar o Mercado Pago.");
      });
    return () => {
      vivo = false;
      try {
        (window as unknown as { paymentBrickController?: { unmount: () => void } }).paymentBrickController?.unmount();
      } catch {
        /* ignore */
      }
    };
  }, [noCliente, publicKey, brickId, pixQr]);

  const initialization = useMemo(() => {
    const payer: { email?: string; identification?: { type: string; number: string } } = {};
    if (email) payer.email = email;
    if (cpf && cpf.length === 11) payer.identification = { type: "CPF", number: cpf };
    return {
      amount,
      locale: "pt-BR",
      ...(Object.keys(payer).length ? { payer } : {}),
    };
  }, [amount, email, cpf]);

  const customization = useMemo(
    () => ({
      paymentMethods: {
        creditCard: "all" as const,
        debitCard: "all" as const,
        bankTransfer: "all" as const,
        maxInstallments: 12,
      },
      visual: { hideFormTitle: true },
    }),
    [],
  );

  const onSubmit = useCallback<NonNullable<PaymentBrickProps["onSubmit"]>>(
    async ({ formData }) => {
      let affiliate_ref: string | null = null;
      try {
        affiliate_ref = sessionStorage.getItem("jogador-pro-affiliate-ref");
      } catch {
        /* ignore */
      }
      const fbp = document.cookie.match(/(^|; )_fbp=([^;]*)/)?.[2];
      const { data, error } = await supabase.functions.invoke("process-payment", {
        body: {
          plano: planoId,
          formData,
          utm: getStoredUtm(),
          affiliate_ref,
          coupon_code: couponCode || null,
          idempotency_key: intentKeyRef.current,
          meta: {
            fbp: fbp ? decodeURIComponent(fbp) : null,
            fbc: getFbc() ?? null,
            client_user_agent: navigator.userAgent,
            event_source_url: window.location.href,
            checkout_time: Math.floor(Date.now() / 1000),
          },
        },
      });

      if (error) {
        toast.error("Pagamento não concluído", { description: error.message });
        throw error;
      }

      const payload = data as {
        id?: string | number;
        status?: string;
        status_detail?: string;
        amount?: number;
        qr_code?: string | null;
        qr_code_base64?: string | null;
        ticket_url?: string | null;
      } | null;
      const status = payload?.status;
      const paid = payload?.amount ?? amount;
      if (status === "approved") {
        gravarPixQr(null);
        setPixQr(null);
        const eventId = payload?.id ? `mp-${payload.id}` : undefined;
        trackMeta("Purchase", { value: paid, currency: "BRL", content_name: planoId }, eventId);
        trackMetaDedup(
          "Subscribe",
          { value: paid, currency: "BRL", content_name: planoId },
          eventId ? { eventId: `${eventId}-sub` } : undefined,
        );
        toast.success("Pagamento aprovado");
        onApprovedRef.current(planoId);
        return;
      }

      if (status === "pending" || status === "in_process") {
        const qr: PixQr = {
          qr_code: payload?.qr_code ?? null,
          qr_code_base64: payload?.qr_code_base64 ?? null,
          ticket_url: payload?.ticket_url ?? null,
        };
        if (qr.qr_code || qr.qr_code_base64) {
          gravarPixQr(qr);
          setPixQr(qr);
          toast.message("Pix gerado", {
            description: "Pague neste celular ou no app do banco. O acesso libera sozinho.",
          });
        } else {
          toast.message("Pagamento pendente", {
            description: "Assim que o Mercado Pago confirmar, seu acesso PRO será liberado.",
          });
        }
        onPendingRef.current?.();
        return;
      }

      toast.error("Pagamento não aprovado", {
        description: payload?.status_detail ?? status,
      });
      intentKeyRef.current =
        typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `mp-${Date.now()}`;
      throw new Error(status ?? "rejected");
    },
    [amount, couponCode, planoId],
  );

  const onError = useCallback((error: unknown) => {
    console.error(error);
    const msg =
      error && typeof error === "object" && "message" in error && typeof error.message === "string"
        ? error.message
        : "Não foi possível abrir o checkout do Mercado Pago.";
    setErroBrick(msg);
    toast.error("Erro no checkout Mercado Pago", { description: msg });
  }, []);

  const onReady = useCallback(() => {
    setPronto(true);
    setErroBrick(null);
  }, []);

  const copiarPix = async () => {
    const codigo = pixQr?.qr_code;
    if (!codigo) return;
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      toast.success("Código Pix copiado");
      window.setTimeout(() => setCopiado(false), 2500);
    } catch {
      toast.error("Não foi possível copiar. Selecione o código e copie na mão.");
    }
  };

  const tentarDeNovo = () => {
    gravarPixQr(null);
    setPixQr(null);
    setCopiado(false);
    setErroBrick(null);
    setPronto(false);
    setBrick(null);
    setBrickId(novoId());
  };

  if (!publicKey) {
    return (
      <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-foreground">
        Configure <code className="text-xs">VITE_MERCADOPAGO_PUBLIC_KEY</code> no ambiente e{" "}
        <code className="text-xs">MERCADOPAGO_ACCESS_TOKEN</code> nas Edge Functions do Supabase.
      </div>
    );
  }

  if (!plano || amount <= 0) {
    return <p className="text-sm text-muted-foreground">Carregando checkout…</p>;
  }

  if (erroBrick) {
    return (
      <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
        <p className="font-extrabold text-foreground">Não foi possível abrir o pagamento</p>
        <p className="mt-1 text-xs text-muted-foreground">{erroBrick}</p>
        <Button type="button" className="mt-3" onClick={tentarDeNovo}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  if (pixQr) {
    return (
      <div className="rounded-2xl border border-primary/30 bg-card p-5 text-center">
        {pixQr.qr_code_base64 ? (
          <img
            alt="QR Code Pix"
            src={`data:image/jpeg;base64,${pixQr.qr_code_base64}`}
            className="mx-auto h-56 w-56 rounded-xl bg-white p-2"
          />
        ) : null}
        <p className="mt-4 text-sm font-extrabold text-foreground">Pague o Pix para liberar o PRO</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Pague neste celular ou no app do banco. O acesso libera sozinho.
        </p>
        {pixQr.qr_code ? (
          <Button type="button" className="mt-4 w-full" onClick={() => void copiarPix()}>
            {copiado ? <Check /> : <Copy />}
            {copiado ? "Código copiado" : "Copiar código Pix"}
          </Button>
        ) : null}
        {pixQr.ticket_url ? (
          <a
            href={pixQr.ticket_url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-xs font-semibold text-primary underline-offset-4 hover:underline"
          >
            Abrir no app do banco
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative min-h-[28rem]">
      {discountPercent > 0 && couponCode ? (
        <p className="mb-2 text-xs text-muted-foreground">
          Cupom <span className="font-semibold text-foreground">{couponCode}</span> · −{discountPercent}% ·{" "}
          <span className="font-semibold text-foreground">R${amount.toFixed(2)}</span>
        </p>
      ) : null}
      {!pronto ? (
        <p className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Abrindo Mercado Pago…
        </p>
      ) : null}
      {noCliente && Brick ? (
        <Brick
          key={brickId}
          id={brickId}
          locale="pt-BR"
          initialization={initialization}
          customization={customization}
          onSubmit={onSubmit}
          onReady={onReady}
          onError={onError}
        />
      ) : null}
    </div>
  );
}
