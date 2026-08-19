/** Links e flags de produto — ajuste sem redeploy de secrets. */
export const PRODUCT = {
  telegramProUrl: (import.meta.env["VITE_TELEGRAM_PRO_URL"] as string | undefined) || "https://t.me/jogadorprosystem",
  whatsappSupport: (import.meta.env["VITE_WHATSAPP_SUPPORT"] as string | undefined) || "",
  affiliateCommissionNote: "30% no plano semestral (programa micro-influenciadores)",
} as const;

export function whatsappSupportHref(texto?: string) {
  const raw = PRODUCT.whatsappSupport.trim();
  if (!raw) return null;
  if (raw.startsWith("http")) {
    if (!texto) return raw;
    const url = new URL(raw);
    if (!url.searchParams.has("text")) url.searchParams.set("text", texto);
    return url.toString();
  }
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const q = texto ? `?text=${encodeURIComponent(texto)}` : "";
  return `https://wa.me/${digits}${q}`;
}
