/**
 * Allowlist de endereços de vídeo.
 *
 * Um link salvo pelo admin acaba virando `src` de <iframe>/<video> e `href`
 * no painel. Sem validação, um endereço `javascript:` ou `data:` viraria
 * execução de código (XSS). Só aceitamos https em domínios conhecidos.
 */

const HOSTS_EMBED = [
  "youtube.com",
  "www.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "youtu.be",
  "vimeo.com",
  "www.vimeo.com",
  "player.vimeo.com",
];

function hostPermitido(host: string) {
  if (HOSTS_EMBED.includes(host)) return true;
  // Arquivos servidos pelo Storage do próprio projeto (URL assinada).
  return host.endsWith(".supabase.co") || host.endsWith(".supabase.in");
}

/** Retorna a URL normalizada quando é segura, ou `null` quando não é. */
export function urlVideoSegura(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const valor = raw.trim();
  if (!valor) return null;
  let u: URL;
  try {
    u = new URL(valor);
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  if (!hostPermitido(u.hostname.toLowerCase())) return null;
  return u.toString();
}

export function ehEmbed(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host.endsWith("youtube.com") ||
      host.endsWith("youtube-nocookie.com") ||
      host === "youtu.be" ||
      host.endsWith("vimeo.com")
    );
  } catch {
    return false;
  }
}

/** Converte um link de YouTube/Vimeo no endereço de embed correspondente. */
export function urlEmbedSegura(url: string): string | null {
  const seguro = urlVideoSegura(url);
  if (!seguro || !ehEmbed(seguro)) return null;
  const u = new URL(seguro);
  const host = u.hostname.toLowerCase();

  if (host === "youtu.be") {
    const id = u.pathname.replace(/^\//, "").split("/")[0];
    return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : null;
  }
  if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
    if (u.pathname.startsWith("/embed/")) return `https://www.youtube.com${u.pathname}`;
    const id = u.searchParams.get("v");
    return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : null;
  }
  if (host.endsWith("vimeo.com")) {
    if (host === "player.vimeo.com") return `https://player.vimeo.com${u.pathname}`;
    const id = u.pathname.replace(/^\//, "").split("/")[0];
    return id ? `https://player.vimeo.com/video/${encodeURIComponent(id)}` : null;
  }
  return null;
}

export const MENSAGEM_URL_INVALIDA =
  "Link não aceito. Use https do YouTube, Vimeo ou um arquivo do próprio armazenamento.";
