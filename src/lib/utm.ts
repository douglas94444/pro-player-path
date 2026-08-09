const UTM_KEY = "jogador-pro-utm-v1";

export type UtmParams = {
  utm_source?: string | undefined;
  utm_medium?: string | undefined;
  utm_campaign?: string | undefined;
  utm_content?: string | undefined;
  utm_term?: string | undefined;
};

export function captureUtmFromSearch(search: URLSearchParams | Record<string, unknown>) {
  const get = (k: string) => {
    if (search instanceof URLSearchParams) return search.get(k) ?? undefined;
    const v = search[k];
    return typeof v === "string" ? v : undefined;
  };

  const next: UtmParams = {};
  const source = get("utm_source");
  const medium = get("utm_medium");
  const campaign = get("utm_campaign");
  const content = get("utm_content");
  const term = get("utm_term");
  if (source) next.utm_source = source;
  if (medium) next.utm_medium = medium;
  if (campaign) next.utm_campaign = campaign;
  if (content) next.utm_content = content;
  if (term) next.utm_term = term;

  if (!Object.values(next).some(Boolean)) return getStoredUtm();

  try {
    sessionStorage.setItem(UTM_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function getStoredUtm(): UtmParams {
  try {
    const raw = sessionStorage.getItem(UTM_KEY);
    return raw ? (JSON.parse(raw) as UtmParams) : {};
  } catch {
    return {};
  }
}

export function captureUtmFromLocation() {
  if (typeof window === "undefined") return {};
  return captureUtmFromSearch(new URLSearchParams(window.location.search));
}
