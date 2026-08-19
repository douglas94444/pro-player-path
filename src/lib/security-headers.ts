/**
 * Cabeçalhos de segurança aplicados a todas as respostas do app.
 *
 * Observação sobre `script-src`: o TanStack Start injeta scripts inline para
 * hidratar o SSR e o Meta Pixel também é inline, por isso `'unsafe-inline'`
 * permanece necessário. Mesmo assim a política bloqueia scripts de domínios
 * fora da lista, iframes de terceiros, plugins e reescrita de <base>.
 *
 * `frame-ancestors`: produção = `'self'`. Preview Lovable precisa da lista
 * de iframes do editor. `X-Frame-Options` fica de fora (não aceita allowlist).
 */
const LOVABLE_HOST =
  /(?:^|\.)lovable\.(?:app|dev)$|(?:^|\.)lovableproject\.com$|^lovable\.dev$/i;

export function isLovablePreviewHost(host: string) {
  const h = host.split(":")[0]?.trim() ?? "";
  return LOVABLE_HOST.test(h);
}

function csp(host?: string | null) {
  const preview = isLovablePreviewHost(host ?? "");
  const ancestors = preview
    ? "'self' https://*.lovable.app https://*.lovable.dev https://lovable.dev https://*.lovableproject.com"
    : "'self'";
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net https://sdk.mercadopago.com https://*.mercadopago.com https://*.mercadolibre.com https://http2.mlstatic.com https://*.mlstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https://*.supabase.co https://videos.pexels.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://graph.facebook.com https://connect.facebook.net https://www.facebook.com https://*.facebook.com https://api.mercadopago.com https://events.mercadopago.com https://*.mercadopago.com https://*.mercadolibre.com https://http2.mlstatic.com https://*.mlstatic.com https://*.lovable.app https://*.lovable.dev https://*.lovableproject.com",
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.facebook.com https://*.facebook.com https://*.mercadopago.com https://*.mercadolibre.com",
    `frame-ancestors ${ancestors}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://www.facebook.com https://*.mercadopago.com",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function securityHeadersFor(host?: string | null): Record<string, string> {
  return {
    "content-security-policy": csp(host),
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(self), usb=()",
    "strict-transport-security": "max-age=31536000; includeSubDomains",
    "cross-origin-opener-policy": "same-origin-allow-popups",
  };
}

/** Default de produção (`frame-ancestors 'self'`). */
export const SECURITY_HEADERS = securityHeadersFor(null);
