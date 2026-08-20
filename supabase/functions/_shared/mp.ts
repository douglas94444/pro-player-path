import { hmacSha256Hex, secretsEqual, sha256Hex } from "./crypto.ts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const PLANOS: Record<string, { nome: string; amount: number }> = {
  mensal: { nome: "Mensal", amount: 1 },
  semestral: { nome: "Semestral", amount: 1 },
  anual: { nome: "Anual", amount: 1 },
};

export type PlanoKey = keyof typeof PLANOS;

/** Só campos que o Brick precisa enviar — nunca espalhar o body do cliente. */
export function pickMpPaymentFields(formData: Record<string, unknown>) {
  const payerIn = (formData.payer ?? {}) as Record<string, unknown>;
  const identificationIn = (payerIn.identification ?? {}) as Record<string, unknown>;
  const payer: Record<string, unknown> = {};
  if (typeof payerIn.email === "string") payer.email = payerIn.email;
  const number =
    typeof identificationIn.number === "string" ? identificationIn.number.replace(/\D/g, "") : "";
  if (number.length === 11) {
    payer.identification = { type: "CPF", number };
  }

  const out: Record<string, unknown> = { payer };
  if (typeof formData.token === "string" && formData.token) out.token = formData.token;
  if (typeof formData.payment_method_id === "string") out.payment_method_id = formData.payment_method_id;
  if (formData.installments != null && formData.installments !== "") {
    out.installments = Number(formData.installments);
  }
  if (formData.issuer_id != null && formData.issuer_id !== "") out.issuer_id = formData.issuer_id;
  return out;
}

/** Chave MP ≤64 chars, sempre amarrada ao user.id — UUID solta do cliente não vale. */
export async function buildIdempotencyKey(userId: string, clientKey: string, fallbackRaw: string) {
  const seed = UUID_RE.test(clientKey.trim()) ? `${userId}|${clientKey.trim()}` : `${userId}|${fallbackRaw}`;
  return (await sha256Hex(seed)).slice(0, 64);
}

export function paymentBelongsToUser(payment: Record<string, unknown>, userId: string) {
  const meta = (payment.metadata ?? {}) as Record<string, unknown>;
  const fromMeta = typeof meta.supabase_user_id === "string" ? meta.supabase_user_id : "";
  const fromRef = typeof payment.external_reference === "string" ? payment.external_reference : "";
  return fromMeta === userId || fromRef === userId;
}

/**
 * Manifesto oficial: `id:[data.id];request-id:[x-request-id];ts:[ts];`
 * Omite pares ausentes. data.id em minúsculas.
 */
export function buildMpManifest(dataId: string, requestId: string, ts: string) {
  const parts: string[] = [];
  if (dataId) parts.push(`id:${dataId.toLowerCase()}`);
  if (requestId) parts.push(`request-id:${requestId}`);
  parts.push(`ts:${ts}`);
  return `${parts.join(";")};`;
}

export function parseMpSignatureHeader(header: string) {
  const out: Record<string, string> = {};
  for (const part of header.split(",")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    out[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
  }
  return out;
}

export async function verifyMpWebhookSignature(opts: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string;
  secret: string;
}) {
  if (!opts.secret || !opts.xSignature) return false;
  const parsed = parseMpSignatureHeader(opts.xSignature);
  const ts = parsed.ts ?? "";
  const v1 = parsed.v1 ?? "";
  if (!ts || !v1) return false;
  const tsNum = Number(ts);
  if (Number.isFinite(tsNum)) {
    const ageMs = Math.abs(Date.now() - tsNum);
    if (ageMs > 15 * 60 * 1000) return false;
  }
  const manifest = buildMpManifest(opts.dataId, opts.xRequestId ?? "", ts);
  const expected = await hmacSha256Hex(opts.secret, manifest);
  return secretsEqual(expected.toLowerCase(), v1.toLowerCase());
}
