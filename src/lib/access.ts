import { getTreino, PLANO_FLAT } from "@/data/training";

/** Todo o catálogo e o plano guiado exigem assinatura (modelo 100% pago). */
export function isSemanaPremium(_semana: number) {
  return true;
}

export function isPlanoKeyPremium(planoKey?: string | null) {
  if (!planoKey) return true;
  return Boolean(PLANO_FLAT.find((p) => p.key === planoKey));
}

export function isTreinoPremium(treinoId: string, _planoKey?: string | null) {
  return Boolean(getTreino(treinoId));
}

export function canAccessTreino(assinante: boolean, _treinoId: string, _planoKey?: string | null) {
  return assinante;
}

export function requiresSubscription(assinante: boolean) {
  return !assinante;
}
