import { PLANO_FLAT } from "@/data/training";
import { hojeBR } from "@/lib/date";

export type SessaoMin = { data: string; planoKey?: string | null | undefined };

function diasEntre(inicioISO: string, fimISO: string) {
  const a = new Date(`${inicioISO}T12:00:00Z`).getTime();
  const b = new Date(`${fimISO}T12:00:00Z`).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.round((b - a) / 86400000);
}

/** Primeira data com treino registrado (fuso BR); hoje se ainda não treinou. */
export function inicioJornada(sessoes: SessaoMin[], hoje = hojeBR()) {
  const datas = sessoes.map((s) => s.data).filter(Boolean).sort();
  return datas[0] ?? hoje;
}

/** Quantidade de dias do plano liberados pela data (1 = só o Dia 1). */
export function diasDesdeInicio(sessoes: SessaoMin[], hoje = hojeBR()) {
  return Math.max(1, diasEntre(inicioJornada(sessoes, hoje), hoje) + 1);
}

/** Dias do plano concluídos em datas anteriores a hoje (grandfathering de progresso). */
export function concluidosAntesDeHoje(sessoes: SessaoMin[], hoje = hojeBR()) {
  const keys = new Set(
    sessoes.filter((s) => s.planoKey && s.data < hoje).map((s) => s.planoKey as string),
  );
  return keys.size;
}

/**
 * Índice (1-based) do último dia do plano liberado hoje.
 * Libera 1 por data do calendário, sem punir quem já tinha progresso anterior.
 */
export function indiceLiberado(sessoes: SessaoMin[], hoje = hojeBR()) {
  return Math.max(diasDesdeInicio(sessoes, hoje), concluidosAntesDeHoje(sessoes, hoje) + 1);
}

/** Posição (1-based) de uma chave do plano guiado; 0 quando não faz parte. */
export function posicaoPlano(key: string) {
  const idx = PLANO_FLAT.findIndex((p) => p.key === key);
  return idx < 0 ? 0 : idx + 1;
}

/** Já concluiu algum dia do plano hoje? (limite de 1 treino guiado por dia) */
export function treinouPlanoHoje(sessoes: SessaoMin[], hoje = hojeBR()) {
  return sessoes.some((s) => Boolean(s.planoKey) && s.data === hoje);
}

/** Chave do plano (guiado ou manutenção) está liberada hoje? */
export function planoKeyLiberada(key: string, sessoes: SessaoMin[], hoje = hojeBR()) {
  if (sessoes.some((s) => s.planoKey === key)) return true;
  if (treinouPlanoHoje(sessoes, hoje)) return false;
  const pos = posicaoPlano(key);
  if (pos === 0) return true; // manutenção/ciclo: só o limite diário se aplica
  if (pos > indiceLiberado(sessoes, hoje)) return false;
  const feitos = new Set(sessoes.map((s) => s.planoKey).filter(Boolean));
  const proximo = PLANO_FLAT.find((p) => !feitos.has(p.key));
  return !proximo || proximo.key === key;
}

/** Milissegundos até a virada do dia em Brasília. */
export function proximaLiberacaoMs(now: Date = new Date()) {
  const amanha = new Date(`${hojeBR(now)}T12:00:00Z`);
  amanha.setUTCDate(amanha.getUTCDate() + 1);
  // meia-noite BR = 03:00 UTC (UTC-3, sem horário de verão)
  const alvo = new Date(`${amanha.toISOString().slice(0, 10)}T03:00:00Z`).getTime();
  return Math.max(0, alvo - now.getTime());
}

/** "5h 12min" / "42min" */
export function formatarEspera(ms: number) {
  const totalMin = Math.max(1, Math.ceil(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}
