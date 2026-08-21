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
