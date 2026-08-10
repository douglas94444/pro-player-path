/** Monta texto/link para compartilhar evolução (story / WhatsApp). */
export function buildShareProgress(opts: {
  nome: string;
  streak: number;
  treinos: number;
  affiliateCode?: string | null;
  milestone?: "streak7" | "semana2" | "geral";
}) {
  const base =
    typeof window !== "undefined" ? window.location.origin : "https://jogadorprosystem.com";
  const ref = opts.affiliateCode ? `?ref=${encodeURIComponent(opts.affiliateCode)}` : "";
  const link = `${base}/campanha${ref}`;

  const headline =
    opts.milestone === "streak7"
      ? `${opts.nome} fez ${opts.streak} dias seguidos no Jogador PRO`
      : opts.milestone === "semana2"
        ? `${opts.nome} concluiu a Semana 2 do Jogador PRO`
        : `${opts.nome} já tem ${opts.treinos} treinos no Jogador PRO`;

  const text = `${headline}.\nPlano diário de 10–20 min pra evoluir no jogo.\n${link}`;
  return { text, link, headline };
}

export async function shareProgress(opts: Parameters<typeof buildShareProgress>[0]) {
  const { text, link } = buildShareProgress(opts);
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title: "Jogador PRO", text, url: link });
      return "shared";
    } catch {
      /* ignore cancel */
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
