/**
 * Cabeçalhos de segurança aplicados a todas as respostas do app.
 *
 * Observação sobre `script-src`: o TanStack Start injeta scripts inline para
 * hidratar o SSR e o Meta Pixel também é inline, por isso `'unsafe-inline'`
 * permanece necessário. Mesmo assim a política bloqueia scripts de domínios
 * fora da lista, iframes de terceiros, plugins e reescrita de <base>.
 *
 * `frame-ancestors` permite os domínios do editor Lovable (o preview roda
 * dentro de um iframe). Por isso não enviamos `X-Frame-Options`, que não
 * aceita lista de domínios e derrubaria o preview — `frame-ancestors` é a
 * versão moderna e mais restritiva do mesmo controle.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net https://sdk.mercadopago.com https://*.mercadopago.com https://*.mercadolibre.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https://*.supabase.co https://videos.pexels.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://graph.facebook.com https://connect.facebook.net https://api.mercadopago.com https://*.mercadopago.com https://*.lovable.app https://*.lovable.dev https://*.lovableproject.com",
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://*.mercadopago.com https://*.mercadolibre.com",
  "frame-ancestors 'self' https://*.lovable.app https://*.lovable.dev https://lovable.dev https://*.lovableproject.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

export const SECURITY_HEADERS: Record<string, string> = {
  "content-security-policy": CSP,
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "cross-origin-opener-policy": "same-origin-allow-popups",
};
