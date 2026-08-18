import { useEffect, useMemo, useState } from "react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { PLANOS_ASSINATURA } from "@/data/training";
import { supabase } from "@/integrations/supabase/client";
import { getFbc, trackMeta, trackMetaDedup } from "@/lib/meta-pixel";
import { getStoredUtm } from "@/lib/utm";
import { toast } from "sonner";

type Props = {
  planoId: string;
  email?: string | null;
  couponCode?: string | null;
  discountPercent?: number;
  onApproved: (plano: string) => void;
  onPending?: () => void;
};

export function MercadoPagoCheckout({
  planoId,
  email,
  couponCode,
  discountPercent = 0,
  onApproved,
  onPending,
}: Props) {
  const [ready, setReady] = useState(false);
  const publicKey = import.meta.env["VITE_MERCADOPAGO_PUBLIC_KEY"] as string | undefined;

  const plano = useMemo(() => PLANOS_ASSINATURA.find((p) => p.id === planoId), [planoId]);
  const baseAmount = (plano?.precoCentavos ?? 0) / 100;
  const amount = Math.max(
    1,
    Math.round(baseAmount * (1 - Math.min(50, Math.max(0, discountPercent)) / 100) * 100) / 100,
  );

  useEffect(() => {
    if (!publicKey) return;
    initMercadoPago(publicKey, { locale: "pt-BR" });
    setReady(true);
  }, [publicKey]);

  if (!publicKey) {
    return (
      <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-foreground">
        Configure <code className="text-xs">VITE_MERCADOPAGO_PUBLIC_KEY</code> no ambiente e{" "}
        <code className="text-xs">MERCADOPAGO_ACCESS_TOKEN</code> nas Edge Functions do Supabase.
      </div>
    );
  }

  if (!ready || !plano || amount <= 0) {
    return <p className="text-sm text-muted-foreground">Carregando checkout…</p>;
  }

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card p-2">
      {discountPercent > 0 && couponCode ? (
        <p className="px-2 pt-2 text-xs text-muted-foreground">
          Cupom <span className="font-semibold text-foreground">{couponCode}</span> · −{discountPercent}% ·{" "}
          <span className="font-semibold text-foreground">R${amount.toFixed(2)}</span>
        </p>
      ) : null}
      <Payment
        key={`${planoId}-${couponCode ?? ""}-${amount}`}
        initialization={{
          amount,
          ...(email ? { payer: { email } } : {}),
        }}
        customization={{
          paymentMethods: {
            creditCard: "all",
            debitCard: "all",
            ticket: "all",
            bankTransfer: "all",
          },
        }}
        onSubmit={async ({ formData }) => {
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
              meta: {
                fbp: fbp ? decodeURIComponent(fbp) : null,
                fbc: getFbc() ?? null,
                client_user_agent: navigator.userAgent,
                event_source_url: window.location.href,
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
          } | null;
          const status = payload?.status;
          const paid = payload?.amount ?? amount;
          if (status === "approved") {
            // event_id igual ao enviado pela CAPI no backend (mp-<payment_id>) → dedup no Meta
            const eventId = payload?.id ? `mp-${payload.id}` : undefined;
            trackMeta("Purchase", { value: paid, currency: "BRL", content_name: planoId }, eventId);
            trackMetaDedup(
              "Subscribe",
              { value: paid, currency: "BRL", content_name: planoId },
              eventId ? { eventId: `${eventId}-sub` } : undefined,
            );
            toast.success("Pagamento aprovado");
            onApproved(planoId);
            return;
          }

          if (status === "pending" || status === "in_process") {
            toast.message("Pagamento pendente", {
              description: "Assim que o Mercado Pago confirmar, seu acesso PRO será liberado.",
            });
            onPending?.();
            return;
          }

          toast.error("Pagamento não aprovado", {
            description: payload?.status_detail ?? status,
          });
          throw new Error(status ?? "rejected");
        }}
        onError={(error) => {
          console.error(error);
          toast.error("Erro no checkout Mercado Pago");
        }}
      />
    </div>
  );
}
