import { createServerFn } from "@tanstack/react-start";

export const getMercadoPagoPublicKey = createServerFn({ method: "GET" }).handler(async () => ({
  publicKey: process.env["MERCADOPAGO_PUBLIC_KEY"] ?? null,
}));