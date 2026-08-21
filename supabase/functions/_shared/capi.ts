import { sha256Hex } from "./crypto.ts";

export const CAPI_EVENT_SOURCE_FALLBACK = "https://jogadorprosystem.com/checkout";

export type CapiEvent = {
  eventName: string;
  eventId: string;
  eventTime: number;
  eventSourceUrl?: string | null;
  referrerUrl?: string | null;
  customerSegmentation?: string | null;
  originalEventData?: { event_name: string; event_time: number };
  userData: Record<string, unknown>;
  customData: Record<string, unknown>;
};

export async function hashIdentifier(valor: string) {
  return sha256Hex(valor);
}

/** Dígitos E.164 BR (`55` + nacional). Vazio se não houver telefone. */
export function normalizarTelefoneBr(valor: string | null | undefined): string {
  const d = String(valor ?? "").replace(/\D/g, "");
  if (!d) return "";
  return d.startsWith("55") ? d : `55${d}`;
}

export async function hashPhoneBr(valor: string | null | undefined): Promise<string | undefined> {
  const e164 = normalizarTelefoneBr(valor);
  if (!e164) return undefined;
  return hashIdentifier(e164);
}

/** Minúsculas, sem acento nem pontuação — spec Meta para `fn`/`ln`. */
export function normalizarNomeMeta(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

/** Primeiro token → fn; restante → ln. Ignora o placeholder "Jogador". */
export function partirNome(nome: string | null | undefined): { fn?: string; ln?: string } {
  const raw = String(nome ?? "").trim();
  if (!raw || raw.toLowerCase() === "jogador") return {};
  const parts = raw.split(/\s+/).filter(Boolean);
  const fn = normalizarNomeMeta(parts[0] ?? "");
  const ln = parts.length > 1 ? normalizarNomeMeta(parts.slice(1).join(" ")) : undefined;
  return {
    ...(fn ? { fn } : {}),
    ...(ln ? { ln } : {}),
  };
}

export async function hashCountryBr() {
  return hashIdentifier("br");
}

export async function aplicarNomeUserData(userData: Record<string, unknown>, nome: string | null | undefined) {
  const { fn, ln } = partirNome(nome);
  if (fn) userData.fn = [await hashIdentifier(fn)];
  if (ln) userData.ln = [await hashIdentifier(ln)];
}

export async function aplicarCountryBr(userData: Record<string, unknown>) {
  userData.country = [await hashCountryBr()];
}

type HeaderGetter = { get(name: string): string | null };

export function collectForwardedIps(headers: HeaderGetter, extra?: string | null): string[] {
  const out: string[] = [];
  const push = (v: string | null | undefined) => {
    if (!v) return;
    for (const part of v.split(",")) {
      const ip = part.trim().replace(/^\[/, "").replace(/\]$/, "");
      if (ip) out.push(ip);
    }
  };
  push(headers.get("cf-connecting-ip"));
  push(headers.get("true-client-ip"));
  push(headers.get("x-forwarded-for"));
  push(headers.get("x-real-ip"));
  push(extra);
  return out;
}

/** IPv6 “de verdade”, não o mapeamento IPv4 `::ffff:x.x.x.x`. */
export function isPreferableIPv6(ip: string) {
  return ip.includes(":") && !ip.toLowerCase().startsWith("::ffff:");
}

/** Prefere IPv6 quando o proxy enviar; senão o primeiro IP da cadeia. Não inventa endereço. */
export function pickClientIp(ips: string[]): string | undefined {
  return (
    ips.find(isPreferableIPv6) ??
    ips.find((ip) => !ip.toLowerCase().startsWith("::ffff:")) ??
    ips[0]
  );
}

export function pickClientIpFromRequest(req: Request, bodyIp?: string | null): string | undefined {
  return pickClientIp(collectForwardedIps(req.headers, bodyIp));
}

export async function sendCapi(event: CapiEvent) {
  const capiToken = Deno.env.get("META_CAPI_ACCESS_TOKEN");
  if (!capiToken) return;
  const pixelId = Deno.env.get("META_PIXEL_ID") ?? "3161156880941929";
  const testEventCode = Deno.env.get("META_TEST_EVENT_CODE");
  const eventSourceUrl = event.eventSourceUrl || CAPI_EVENT_SOURCE_FALLBACK;
  await fetch(`https://graph.facebook.com/v21.0/${pixelId}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      access_token: capiToken,
      data: [
        {
          event_name: event.eventName,
          event_time: event.eventTime,
          event_id: event.eventId,
          action_source: "website",
          event_source_url: eventSourceUrl,
          ...(event.referrerUrl ? { referrer_url: event.referrerUrl } : {}),
          data_processing_options: [],
          ...(event.customerSegmentation ? { customer_segmentation: event.customerSegmentation } : {}),
          ...(event.originalEventData ? { original_event_data: event.originalEventData } : {}),
          user_data: event.userData,
          custom_data: event.customData,
        },
      ],
      ...(testEventCode ? { test_event_code: testEventCode } : {}),
    }),
  }).catch(console.error);
}
