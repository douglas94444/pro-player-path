import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { renderErrorPage } from "./lib/error-page";
import { SECURITY_HEADERS } from "./lib/security-headers";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8", ...SECURITY_HEADERS },
    });
  }
});

// CSP, nosniff, referrer-policy e afins em toda resposta do servidor.
const securityHeadersMiddleware = createMiddleware().server(async ({ next }) => {
  setResponseHeaders(SECURITY_HEADERS);
  const result = await next();
  const response =
    result instanceof Response
      ? result
      : ((result as { response?: Response } | undefined)?.response ?? null);
  if (response) {
    try {
      for (const [chave, valor] of Object.entries(SECURITY_HEADERS)) {
        response.headers.set(chave, valor);
      }
    } catch {
      // headers imutáveis: os cabeçalhos já foram aplicados via setResponseHeaders
    }
  }
  return result;
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [securityHeadersMiddleware, errorMiddleware, csrfMiddleware],
}));
