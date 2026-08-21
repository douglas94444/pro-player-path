import { supabase } from "@/integrations/supabase/client";
import { phoneE164Br } from "@/lib/br-docs";
import { partirNome } from "@/lib/meta-nome";

export const META_PIXEL_ID = "3161156880941929";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

type MetaPayload = Record<string, string | number | boolean | undefined>;

export type MetaIdentidade = {
  email?: string | undefined;
  phone?: string | undefined;
  firstName?: string | undefined;
  lastName?: string | undefined;
  externalId?: string | undefined;
  fbp?: string | undefined;
  fbc?: string | undefined;
};

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
const EID_KEY = "jps:meta-eid";
const FBC_MAX_AGE = 60 * 60 * 24 * 90;

export function montarFbc(fbclid: string, now = Date.now()) {
  return `fb.1.${now}.${fbclid}`;
}

export function fbcCookieAttrs(secure: boolean) {
  return `path=/; max-age=${FBC_MAX_AGE}; SameSite=Lax${secure ? "; Secure" : ""}`;
}

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
    const existente = getFbc();
    if (existente && existente.endsWith(`.${fbclid}`)) return;
    const valor = montarFbc(fbclid);
    localStorage.setItem(FBC_KEY, valor);
    const secure = window.location.protocol === "https:";
    document.cookie = `_fbc=${valor}; ${fbcCookieAttrs(secure)}`;
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

/** UUID anônimo estável (sem telefone) para amarrar eventos antes do login. */
export function getAnonymousExternalId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existente = localStorage.getItem(EID_KEY);
    if (existente) return existente;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(EID_KEY, id);
    return id;
  } catch {
    return "";
  }
}

let perfilCache: { userId: string; phone: string | null; nome: string | null } | null = null;
let matchingKey = "";

async function fetchPerfilMeta(userId: string): Promise<{ phone?: string | undefined; nome?: string | undefined }> {
  if (perfilCache?.userId === userId) {
    return {
      phone: perfilCache.phone ? phoneE164Br(perfilCache.phone) : undefined,
      nome: perfilCache.nome ?? undefined,
    };
  }
  const { data: perfil } = await supabase.from("profiles").select("phone, nome").eq("id", userId).maybeSingle();
  perfilCache = { userId, phone: perfil?.phone ?? null, nome: perfil?.nome ?? null };
  return {
    phone: perfilCache.phone ? phoneE164Br(perfilCache.phone) : undefined,
    nome: perfilCache.nome ?? undefined,
  };
}

async function resolverIdentidade(overrides?: {
  email?: string | null;
  phone?: string | null;
  nome?: string | null;
}): Promise<MetaIdentidade> {
  captureFbclid();
  const fbp = cookie("_fbp");
  const fbc = getFbc();
  let email = overrides?.email?.trim() || undefined;
  let phone = overrides?.phone ? phoneE164Br(overrides.phone) : undefined;
  let nome = overrides?.nome?.trim() || undefined;
  let externalId = getAnonymousExternalId() || undefined;

  try {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (user?.id) {
      externalId = user.id;
      if (!email) email = user.email ?? undefined;
      const perfil = await fetchPerfilMeta(user.id);
      if (!phone) phone = perfil.phone;
      if (!nome) nome = perfil.nome;
      if (overrides?.phone) {
        perfilCache = {
          userId: user.id,
          phone: overrides.phone,
          nome: nome ?? perfilCache?.nome ?? null,
        };
      }
    } else {
      perfilCache = null;
    }
  } catch {
    /* ignore */
  }

  if (email) email = email.toLowerCase();
  const { fn, ln } = partirNome(nome);
  return { email, phone, firstName: fn, lastName: ln, externalId, fbp, fbc };
}

export function applyAdvancedMatching(ident: MetaIdentidade) {
  if (typeof window === "undefined") return;
  const key = `${ident.email ?? ""}|${ident.phone ?? ""}|${ident.firstName ?? ""}|${ident.lastName ?? ""}|${ident.externalId ?? ""}`;
  if (!key.replace(/\|/g, "") || key === matchingKey) return;
  matchingKey = key;
  try {
    window.fbq?.("init", META_PIXEL_ID, {
      ...(ident.email ? { em: ident.email } : {}),
      ...(ident.phone ? { ph: ident.phone } : {}),
      ...(ident.firstName ? { fn: ident.firstName } : {}),
      ...(ident.lastName ? { ln: ident.lastName } : {}),
      country: "br",
      ...(ident.externalId ? { external_id: ident.externalId } : {}),
    });
  } catch {
    /* ignore */
  }
}

/** Reaplica Advanced Matching quando a sessão hidrata (sem gravar telefone no localStorage). */
export async function hydrateMetaIdentity() {
  const ident = await resolverIdentidade();
  applyAdvancedMatching(ident);
}

function firePixel(event: string, payload: MetaPayload | undefined, eventId: string | undefined, custom: boolean) {
  if (typeof window === "undefined") return;
  try {
    const opts = eventId ? { eventID: eventId } : undefined;
    const method = custom ? "trackCustom" : "track";
    if (payload) window.fbq?.(method, event, payload, opts);
    else window.fbq?.(method, event, {}, opts);
  } catch {
    /* ignore */
  }
}

export function trackMeta(event: string, payload?: MetaPayload, eventId?: string) {
  firePixel(event, payload, eventId, false);
}

export function trackMetaCustom(event: string, payload?: MetaPayload, eventId?: string) {
  trackMetaDedup(event, payload, { custom: true, eventId });
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
    phone?: string | null;
    nome?: string | null;
    custom?: boolean;
    /** Unix em segundos — quando a ação ocorreu de fato. */
    eventTime?: number;
    /** Só atribuição, sem otimização de entrega. */
    optOut?: boolean;
    customerSegmentation?: string;
  },
) {
  if (typeof window === "undefined") return;
  captureFbclid();
  const eventId = options?.eventId ?? newEventId(event.toLowerCase());
  firePixel(event, payload, eventId, Boolean(options?.custom));

  const value = typeof payload?.["value"] === "number" ? (payload["value"] as number) : 0;
  const eventSourceUrl = window.location.href;
  const referrer = document.referrer || undefined;

  void (async () => {
    const ident = await resolverIdentidade({
      email: options?.email,
      phone: options?.phone,
      nome: options?.nome,
    });
    applyAdvancedMatching(ident);

    if (!ident.email && !ident.phone && !ident.fbp && !ident.fbc && !ident.externalId) return;

    await supabase.functions.invoke("meta-capi", {
      body: {
        event_name: event,
        event_id: eventId,
        event_time: options?.eventTime ?? Math.floor(Date.now() / 1000),
        email: ident.email,
        phone: ident.phone,
        first_name: ident.firstName,
        last_name: ident.lastName,
        external_id: ident.externalId,
        value,
        currency: (payload?.["currency"] as string) ?? "BRL",
        custom_data: payload ?? {},
        customer_segmentation: options?.customerSegmentation,
        opt_out: options?.optOut,
        event_source_url: eventSourceUrl,
        referrer_url: referrer,
        client_user_agent: navigator.userAgent,
        fbp: ident.fbp,
        fbc: ident.fbc,
      },
    });
  })().catch(() => {
    /* tracking nunca quebra a UI */
  });
}
