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
  options?: { eventId?: string; email?: string | null; custom?: boolean },
) {
  if (typeof window === "undefined") return;
  const eventId = options?.eventId ?? newEventId(event.toLowerCase());
  if (options?.custom) trackMetaCustom(event, payload, eventId);
  else trackMeta(event, payload, eventId);

  const value = typeof payload?.["value"] === "number" ? (payload["value"] as number) : 0;
  void supabase.functions
    .invoke("meta-capi", {
      body: {
        event_name: event,
        event_id: eventId,
        email: options?.email ?? undefined,
        value,
        currency: (payload?.["currency"] as string) ?? "BRL",
        custom_data: payload ?? {},
        event_source_url: window.location.href,
        client_user_agent: navigator.userAgent,
        fbp: cookie("_fbp"),
        fbc: cookie("_fbc"),
      },
    })
    .catch(() => {
      /* tracking nunca quebra a UI */
    });
}
