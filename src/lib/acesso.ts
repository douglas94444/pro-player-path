export type PlanoAssinatura = "mensal" | "semestral" | "anual";

export function asPlanoAssinatura(v: string | null | undefined): PlanoAssinatura | null {
  if (v === "mensal" || v === "semestral" || v === "anual") return v;
  return null;
}

export const PLANO_DIAS = {
  mensal: 31,
  semestral: 183,
  anual: 366,
} as const;

export function diasDoPlano(plano: string) {
  return PLANO_DIAS[plano as keyof typeof PLANO_DIAS] ?? PLANO_DIAS.semestral;
}

/** Soma o período do plano a partir de agora ou do vencimento futuro, o que for maior. */
export function extenderAcesso(atual: string | null | undefined, plano: string, from = new Date()) {
  const dias = diasDoPlano(plano);
  const atualMs = atual ? new Date(atual).getTime() : 0;
  const inicio = Number.isFinite(atualMs) && atualMs > from.getTime() ? new Date(atualMs) : from;
  const next = new Date(inicio.getTime());
  next.setUTCDate(next.getUTCDate() + dias);
  return next.toISOString();
}

export function acessoProAtivo(
  assinante: boolean,
  until?: string | null,
  pausedUntil?: string | null,
) {
  if (!assinante) return false;
  if (pausedUntil) {
    const paused = new Date(pausedUntil).getTime();
    if (Number.isFinite(paused) && paused > Date.now()) return false;
  }
  if (!until) return true;
  const t = new Date(until).getTime();
  return Number.isFinite(t) && t > Date.now();
}
