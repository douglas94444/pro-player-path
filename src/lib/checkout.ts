import { CAMPANHA } from "@/data/campanha-copy";
import { PLANOS_ASSINATURA } from "@/data/training";
import { supabase } from "@/integrations/supabase/client";
import type { UtmParams } from "@/lib/utm";

export const PLANO_PADRAO = CAMPANHA.heroCtaPlano;

export type CheckoutSearch = {
  from?: string;
  checkout?: string;
  plano?: string;
  teaser?: string;
  ref?: string;
  /** PKCE de confirmação de e-mail — o router não pode descartar. */
  code?: string;
} & UtmParams;

export function parseCheckoutSearch(search: Record<string, unknown>): CheckoutSearch {
  const out: CheckoutSearch = {};
  if (typeof search["from"] === "string") out.from = search["from"];
  if (typeof search["checkout"] === "string") out.checkout = search["checkout"];
  if (typeof search["teaser"] === "string") out.teaser = search["teaser"];
  if (typeof search["ref"] === "string") out.ref = search["ref"];
  if (typeof search["code"] === "string") out.code = search["code"];
  if (typeof search["utm_source"] === "string") out.utm_source = search["utm_source"];
  if (typeof search["utm_medium"] === "string") out.utm_medium = search["utm_medium"];
  if (typeof search["utm_campaign"] === "string") out.utm_campaign = search["utm_campaign"];
  if (typeof search["utm_content"] === "string") out.utm_content = search["utm_content"];
  if (typeof search["utm_term"] === "string") out.utm_term = search["utm_term"];
  if (typeof search["plano"] === "string") {
    const ids = new Set(PLANOS_ASSINATURA.map((p) => p.id));
    if (ids.has(search["plano"])) out.plano = search["plano"];
  }
  return out;
}

export const validateLandingSearch = parseCheckoutSearch;
export type LandingSearch = CheckoutSearch;

export function isCheckoutAuthFrom(from?: string) {
  return from === "checkout" || from === "planos";
}

export function checkoutEmailRedirect(origin: string, plano?: string) {
  const url = new URL("/checkout", origin);
  url.searchParams.set("checkout", "1");
  url.searchParams.set("from", "auth");
  if (plano) url.searchParams.set("plano", plano);
  return url.toString();
}

export function searchCheckout(
  extra: {
    from?: string | undefined;
    plano?: string | undefined;
    teaser?: string | undefined;
    checkout?: string | undefined;
    ref?: string | undefined;
    utm_source?: string | undefined;
    utm_medium?: string | undefined;
    utm_campaign?: string | undefined;
    utm_content?: string | undefined;
    utm_term?: string | undefined;
  } = {},
): CheckoutSearch {
  const out: CheckoutSearch = { plano: extra.plano ?? PLANO_PADRAO };
  if (extra.from) out.from = extra.from;
  if (extra.checkout) out.checkout = extra.checkout;
  if (extra.teaser) out.teaser = extra.teaser;
  if (extra.ref) out.ref = extra.ref;
  if (extra.utm_source) out.utm_source = extra.utm_source;
  if (extra.utm_medium) out.utm_medium = extra.utm_medium;
  if (extra.utm_campaign) out.utm_campaign = extra.utm_campaign;
  if (extra.utm_content) out.utm_content = extra.utm_content;
  if (extra.utm_term) out.utm_term = extra.utm_term;
  return out;
}

/** Tenta abrir a sessão logo após o signUp — evita travar o Pix na confirmação de e-mail. */
export async function garantirSessaoAposCadastro(email: string, senha: string) {
  const { data: atual } = await supabase.auth.getSession();
  if (atual.session) return { session: atual.session, precisaConfirmarEmail: false as const };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (data.session) return { session: data.session, precisaConfirmarEmail: false as const };
  const msg = (error?.message ?? "").toLowerCase();
  return {
    session: null,
    precisaConfirmarEmail: msg.includes("email not confirmed"),
    erro: error?.message,
  };
}

export async function registrarCheckoutIntent(plano: string) {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) return;
  await supabase.from("checkout_intents").upsert(
    {
      user_id: userId,
      plano,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
}

export function traduzErroAuth(mensagem: string) {
  const m = mensagem.toLowerCase();
  if (m.includes("already registered") || m.includes("user already"))
    return "Este e-mail já tem conta. Faça login ou use “Esqueci minha senha”.";
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (m.includes("password should be")) return "Senha muito curta. Use pelo menos 8 caracteres.";
  if (m.includes("rate limit") || m.includes("too many")) return "Muitas tentativas. Aguarde alguns minutos.";
  return mensagem;
}
