import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { extenderAcesso } from "@/lib/acesso";

/**
 * "Já paguei — atualizar agora": consulta o Mercado Pago direto e libera o PRO
 * quando o pagamento já foi aprovado mas o webhook não chegou.
 */
export const sincronizarPagamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const accessToken = process.env["MERCADOPAGO_ACCESS_TOKEN"];
    if (!accessToken) return { status: "unconfigured" as const, assinante: false, plano: null };

    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const ids: string[] = [];
    const { data: eventos } = await supabaseAdmin
      .from("payment_events")
      .select("payload, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    for (const ev of eventos ?? []) {
      const payload = (ev.payload ?? {}) as Record<string, unknown>;
      const id = payload["id"];
      if (id != null && !ids.includes(String(id))) ids.push(String(id));
    }

    if (ids.length === 0) {
      const res = await fetch(
        `https://api.mercadopago.com/v1/payments/search?external_reference=${userId}&sort=date_created&criteria=desc&limit=10`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const search = (await res.json().catch(() => ({}))) as { results?: Array<{ id?: string | number }> };
      for (const p of search.results ?? []) {
        if (p?.id != null) ids.push(String(p.id));
      }
    }

    let status = "not_found";
    let planoAtivo: string | null = null;

    for (const id of ids) {
      const res = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) continue;
      const payment = (await res.json()) as Record<string, any>;

      const metadata = (payment["metadata"] ?? {}) as Record<string, unknown>;
      const pertence =
        metadata["supabase_user_id"] === userId || payment["external_reference"] === userId;
      if (!pertence) continue;

      const plano = typeof metadata["plano"] === "string" ? (metadata["plano"] as string) : "semestral";
      const pagamentoStatus = String(payment["status"] ?? "unknown");
      if (status === "not_found") status = pagamentoStatus;

      await supabaseAdmin.from("payment_events").upsert(
        {
          user_id: userId,
          stripe_event_id: `mp-${payment["id"]}-${pagamentoStatus}`,
          event_type: `payment.${pagamentoStatus}`,
          plano,
          payload: payment,
        },
        { onConflict: "stripe_event_id" },
      );

      if (pagamentoStatus === "approved") {
        const { data: perfilAntes } = await supabaseAdmin
          .from("profiles")
          .select("assinante, assinante_until, mp_payment_id")
          .eq("id", userId)
          .maybeSingle();

        const mesmoPagamento = perfilAntes?.mp_payment_id === String(payment["id"]);
        await supabaseAdmin
          .from("profiles")
          .update({
            assinante: true,
            plano,
            ...(mesmoPagamento
              ? {}
              : { assinante_until: extenderAcesso(perfilAntes?.assinante_until, plano) }),
            mp_payment_id: String(payment["id"]),
            mp_payer_id: payment["payer"]?.id ? String(payment["payer"].id) : null,
            paused_until: null,
            pause_reason: null,
            pause_used_at: null,
            cancelled_at: null,
            cancel_reason: null,
          })
          .eq("id", userId);

        await supabaseAdmin
          .from("checkout_intents")
          .update({ purchased_at: new Date().toISOString(), plano })
          .eq("user_id", userId);

        status = "approved";
        planoAtivo = plano;
        break;
      }
    }

    return { status, assinante: status === "approved", plano: planoAtivo };
  });
