/** Todo o catálogo e o plano guiado exigem assinatura (modelo 100% pago). */
export function canAccessTreino(assinante: boolean, _treinoId?: string, _planoKey?: string | null) {
  return assinante;
}
