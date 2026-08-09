export const META_PIXEL_ID = "3161156880941929";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

type MetaPayload = Record<string, string | number | boolean | undefined>;

export function trackMeta(event: string, payload?: MetaPayload) {
  if (typeof window === "undefined") return;
  try {
    if (payload) window.fbq?.("track", event, payload);
    else window.fbq?.("track", event);
  } catch {
    /* ignore */
  }
}

export function trackMetaCustom(event: string, payload?: MetaPayload) {
  if (typeof window === "undefined") return;
  try {
    if (payload) window.fbq?.("trackCustom", event, payload);
    else window.fbq?.("trackCustom", event);
  } catch {
    /* ignore */
  }
}
