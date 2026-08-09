import { useEffect, useMemo, useState } from "react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { PLANOS_ASSINATURA } from "@/data/training";
import { supabase } from "@/integrations/supabase/client";
import { trackMeta } from "@/lib/meta-pixel";
import { toast } from "sonner";

type Props = {
  planoId: string;
  email?: string | null;
  onApproved: (plano: string) => void;
  onPending?: () => void;
};

export function MercadoPagoCheckout({ planoId, email, onApproved, onPending }: Props) {
  const [ready, setReady] = useState(false);
  const publicKey = import.meta.env["VITE_MERCADOPAGO_PUBLIC_KEY"] as string | undefined;

  const plano = useMemo(() => PLANOS_ASSINATURA.find((p) => p.id === planoId), [planoId]);
  const amount = (plano?.precoCentavos ?? 0) / 100;

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
      <Payment
        key={planoId}
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
          const { data, error } = await supabase.functions.invoke("process-payment", {
            body: { plano: planoId, formData },
          });

          if (error) {
            toast.error("Pagamento não concluído", { description: error.message });
            throw error;
          }

          const status = (data as { status?: string } | null)?.status;
          if (status === "approved") {
            trackMeta("Purchase", { value: amount, currency: "BRL" });
            trackMeta("Subscribe", { value: amount, currency: "BRL" });
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
            description: (data as { status_detail?: string } | null)?.status_detail ?? status,
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
