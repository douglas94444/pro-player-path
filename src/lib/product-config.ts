/** Links e flags de produto — ajuste sem redeploy de secrets. */
export const PRODUCT = {
  telegramProUrl: (import.meta.env["VITE_TELEGRAM_PRO_URL"] as string | undefined) || "https://t.me/jogadorprosystem",
  whatsappSupport: (import.meta.env["VITE_WHATSAPP_SUPPORT"] as string | undefined) || "",
  affiliateCommissionNote: "30% no plano semestral (programa micro-influenciadores)",
} as const;
