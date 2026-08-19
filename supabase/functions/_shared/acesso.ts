export const PLANO_DIAS = {
  mensal: 31,
  semestral: 183,
  anual: 366,
} as const;

export function diasDoPlano(plano: string) {
  return PLANO_DIAS[plano as keyof typeof PLANO_DIAS] ?? PLANO_DIAS.semestral;
}

export function extenderAcesso(atual: string | null | undefined, plano: string, from = new Date()) {
  const dias = diasDoPlano(plano);
  const atualMs = atual ? new Date(atual).getTime() : 0;
  const inicio = Number.isFinite(atualMs) && atualMs > from.getTime() ? new Date(atualMs) : from;
  const next = new Date(inicio.getTime());
  next.setUTCDate(next.getUTCDate() + dias);
  return next.toISOString();
}
