import { supabase } from "@/integrations/supabase/client";

export const META_PIXEL_ID = "3161156880941929";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

type MetaPayload = Record<string, string | number | boolean | undefined>;

/** ID compartilhado cliente↔CAPI para o Meta deduplicar o mesmo evento. */
export function newEventId(prefix = "evt"): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${prefix}-${rand}`;
}

function cookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(new RegExp(`(^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[2]!) : undefined;
}

const FBC_KEY = "jps:fbc";

/**
 * Captura o `fbclid` da URL do anúncio e persiste o `fbc` no formato exigido
 * pela Meta (`fb.1.<timestamp>.<fbclid>`) por 90 dias — o cookie `_fbc` só é
 * criado pelo Pixel e pode não existir na primeira visita.
 */
export function captureFbclid(): void {
  if (typeof window === "undefined") return;
  try {
    const fbclid = new URLSearchParams(window.location.search).get("fbclid");
    if (!fbclid) return;
    const valor = `fb.1.${Date.now()}.${fbclid}`;
    localStorage.setItem(FBC_KEY, valor);
    document.cookie = `_fbc=${valor}; path=/; max-age=${60 * 60 * 24 * 90}; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

/** `_fbc` do Pixel, com fallback para o valor derivado do `fbclid`. */
export function getFbc(): string | undefined {
  const doCookie = cookie("_fbc");
  if (doCookie) return doCookie;
  try {
    return localStorage.getItem(FBC_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}


export function trackMeta(event: string, payload?: MetaPayload, eventId?: string) {
  if (typeof window === "undefined") return;
  try {
    const opts = eventId ? { eventID: eventId } : undefined;
    if (payload) window.fbq?.("track", event, payload, opts);
    else window.fbq?.("track", event, {}, opts);
  } catch {
    /* ignore */
  }
}

export function trackMetaCustom(event: string, payload?: MetaPayload, eventId?: string) {
  if (typeof window === "undefined") return;
  try {
    const opts = eventId ? { eventID: eventId } : undefined;
    if (payload) window.fbq?.("trackCustom", event, payload, opts);
    else window.fbq?.("trackCustom", event, {}, opts);
  } catch {
    /* ignore */
  }
}

/**
 * Dispara o evento no pixel do navegador e na Conversions API com o MESMO
 * event_id — o Meta descarta a cópia duplicada automaticamente.
 */
export function trackMetaDedup(
  event: string,
  payload?: MetaPayload,
  options?: {
    eventId?: string;
    email?: string | null;
    custom?: boolean;
    /** Unix em segundos — quando a ação ocorreu de fato. */
    eventTime?: number;
    /** Só atribuição, sem otimização de entrega. */
    optOut?: boolean;
    customerSegmentation?: string;
  },
) {
  if (typeof window === "undefined") return;
  const eventId = options?.eventId ?? newEventId(event.toLowerCase());
  if (options?.custom) trackMetaCustom(event, payload, eventId);
  else trackMeta(event, payload, eventId);

  const value = typeof payload?.["value"] === "number" ? (payload["value"] as number) : 0;
  const fbp = cookie("_fbp");
  const fbc = getFbc();
  const eventSourceUrl = window.location.href;
  const referrer = document.referrer || undefined;

  void (async () => {
    // external_id amarra o mesmo usuário entre dispositivos (hash feito no servidor).
    let externalId: string | undefined;
    let email = options?.email ?? undefined;
    try {
      const { data } = await supabase.auth.getSession();
      externalId = data.session?.user.id;
      if (!email) email = data.session?.user.email ?? undefined;
    } catch {
      /* ignore */
    }

    // Sem nenhum identificador a CAPI rejeita o evento: o pixel já o contabilizou.
    if (!email && !fbp && !fbc && !externalId) return;

    await supabase.functions.invoke("meta-capi", {
      body: {
        event_name: event,
        event_id: eventId,
        event_time: options?.eventTime ?? Math.floor(Date.now() / 1000),
        email,
        external_id: externalId,
        value,
        currency: (payload?.["currency"] as string) ?? "BRL",
        custom_data: payload ?? {},
        customer_segmentation: options?.customerSegmentation,
        opt_out: options?.optOut,
        event_source_url: eventSourceUrl,
        referrer_url: referrer,
        client_user_agent: navigator.userAgent,
        fbp,
        fbc,
      },
    });
  })()


    .catch(() => {
      /* tracking nunca quebra a UI */
    });
}
