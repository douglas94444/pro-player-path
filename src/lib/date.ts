const TZ = "America/Sao_Paulo";
const fmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Data (YYYY-MM-DD) no fuso de Brasília — igual ao usado no servidor. */
export function hojeBR(date: Date = new Date()): string {
  return fmt.format(date);
}

/** Dia da semana (0=domingo) no fuso de Brasília. */
export function diaSemanaBR(date: Date = new Date()): number {
  const iso = hojeBR(date);
  return new Date(`${iso}T12:00:00Z`).getUTCDay();
}

/** Segunda-feira da semana atual (YYYY-MM-DD) no fuso de Brasília. */
export function inicioSemanaBR(date: Date = new Date()): string {
  const day = diaSemanaBR(date);
  const diff = day === 0 ? -6 : 1 - day;
  const base = new Date(`${hojeBR(date)}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + diff);
  return base.toISOString().slice(0, 10);
}

/** Data em Brasília deslocada por N dias (positivo = futuro). */
export function diaBROffset(offset: number, date: Date = new Date()): string {
  const base = new Date(`${hojeBR(date)}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + offset);
  return base.toISOString().slice(0, 10);
}

/** Hora local do usuário em Brasília (0-23). */
export function horaBR(date: Date = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hour12: false }).format(date),
  );
}
