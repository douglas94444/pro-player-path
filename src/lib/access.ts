import { getTreino, PLANO_FLAT } from "@/data/training";

/** Semanas 3–4 do plano guiado exigem assinatura. */
export function isSemanaPremium(semana: number) {
  return semana >= 3;
}

export function isPlanoKeyPremium(planoKey?: string | null) {
  if (!planoKey) return false;
  const item = PLANO_FLAT.find((p) => p.key === planoKey);
  if (!item) return false;
  return isSemanaPremium(item.semana) || Boolean(getTreino(item.treinoId)?.premium);
}

export function isTreinoPremium(treinoId: string, planoKey?: string | null) {
  if (isPlanoKeyPremium(planoKey)) return true;
  return Boolean(getTreino(treinoId)?.premium);
}

export function canAccessTreino(assinante: boolean, treinoId: string, planoKey?: string | null) {
  if (assinante) return true;
  return !isTreinoPremium(treinoId, planoKey);
}
