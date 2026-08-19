import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createUserClient } from "../_shared/auth.ts";
import { hashIdentifier } from "../_shared/capi.ts";

const ORIGENS_PERMITIDAS = [
  /^https:\/\/(www\.)?jogadorprosystem\.com$/,
  /^https:\/\/[a-z0-9-]+\.lovable\.app$/,
  /^https:\/\/[a-z0-9-]+\.lovable\.dev$/,
  /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/,
  /^http:\/\/localhost(:\d+)?$/,
];

const EVENTOS_PERMITIDOS = new Set([
  "PageView",
  "ViewContent",
  "Lead",
  "InitiateCheckout",
  "AddToCart",
  "Purchase",
  "Subscribe",
  "CompleteRegistration",
]);

function corsFor(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const permitido = ORIGENS_PERMITIDAS.some((re) => re.test(origin));
  return {
    "Access-Control-Allow-Origin": permitido ? origin : "null",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    Vary: "Origin",
  };
}

/** Eventos com valor monetário exigem chamador confiável (sessão ou segredo). */
const EVENTOS_SENSIVEIS = new Set(["Purchase", "Subscribe"]);

type Confianca = "anon" | "auth";

async function nivelDoChamador(req: Request): Promise<Confianca> {
  const shared = Deno.env.get("META_CAPI_APP_SECRET") ?? "";
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (shared && token === shared) return "auth";
  if (!token) return "anon";
  try {
    const supabase = createUserClient(auth);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ? "auth" : "anon";
  } catch {
    return "anon";
  }
}

Deno.serve(async (req) => {
  const cors = corsFor(req);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (cors["Access-Control-Allow-Origin"] === "null") {
    return json({ ok: false, error: "origem não permitida" }, 403);
  }
  const confianca = await nivelDoChamador(req);

  try {
    const pixelId = Deno.env.get("META_PIXEL_ID") ?? "3161156880941929";
    const accessToken = Deno.env.get("META_CAPI_ACCESS_TOKEN");
    if (!accessToken) {
      return json({ ok: false, skipped: "META_CAPI_ACCESS_TOKEN missing" });
    }

    const body = await req.json();
    const eventName = String(body.event_name ?? "Purchase");
    if (!EVENTOS_PERMITIDOS.has(eventName)) {
      return json({ ok: false, error: "invalid_event" }, 400);
    }
    if (EVENTOS_SENSIVEIS.has(eventName) && confianca !== "auth") {
      return json({ ok: false, error: "Unauthorized" }, 401);
    }
    const eventId = String(body.event_id ?? crypto.randomUUID());
    const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : undefined;
    const value = Number(body.value ?? 0);
    const currency = String(body.currency ?? "BRL");
    const customData = (body.custom_data ?? {}) as Record<string, unknown>;

    const userData: Record<string, unknown> = {};
    if (email) userData.em = [await hashIdentifier(email)];

    const phoneRaw = typeof body.phone === "string" ? body.phone.replace(/\D/g, "") : "";
    if (phoneRaw) userData.ph = [await hashIdentifier(phoneRaw)];

    const externalId = typeof body.external_id === "string" ? body.external_id.trim() : "";
    if (externalId) {
      userData.external_id = [
        /^[a-f0-9]{64}$/i.test(externalId) ? externalId.toLowerCase() : await hashIdentifier(externalId),
      ];
    }

    const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ip = body.client_ip_address ?? forwarded;
    if (ip) userData.client_ip_address = ip;
    const ua = body.client_user_agent ?? req.headers.get("user-agent");
    if (ua) userData.client_user_agent = ua;
    if (body.fbp) userData.fbp = body.fbp;
    if (body.fbc) userData.fbc = body.fbc;

    const temIdentificador = Boolean(
      userData.em || userData.ph || userData.external_id || userData.fbp || userData.fbc,
    );
    if (!temIdentificador) {
      return json({ ok: false, skipped: "no user_data identifiers" });
    }

    const testEventCode = Deno.env.get("META_TEST_EVENT_CODE");

    const agora = Math.floor(Date.now() / 1000);
    const normalizarTempo = (v: unknown, fallback: number) => {
      const n = Number(v);
      if (!Number.isFinite(n) || n <= 0) return fallback;
      if (n > agora + 60 || n < agora - 7 * 24 * 3600) return fallback;
      return Math.floor(n);
    };
    const eventTime = normalizarTempo(body.event_time, agora);

    const segmentation =
      typeof body.customer_segmentation === "string" ? body.customer_segmentation : undefined;

    let originalEventData: Record<string, unknown> | undefined;
    const oed = body.original_event_data as Record<string, unknown> | undefined;
    if (oed && typeof oed.event_name === "string") {
      originalEventData = {
        event_name: oed.event_name,
        ...(oed.event_time ? { event_time: normalizarTempo(oed.event_time, eventTime) } : {}),
      };
    }

    const payload = {
      access_token: accessToken,
      data: [
        {
          event_name: eventName,
          event_time: eventTime,
          event_id: eventId,
          action_source: "website",
          event_source_url: body.event_source_url ?? undefined,
          referrer_url: body.referrer_url ?? undefined,
          ...(body.opt_out === true ? { opt_out: true } : {}),
          data_processing_options: [],
          ...(originalEventData ? { original_event_data: originalEventData } : {}),
          user_data: userData,
          custom_data: {
            currency,
            value,
            ...customData,
            ...(segmentation ? { customer_segmentation: segmentation } : {}),
          },
        },
      ],
      ...(testEventCode ? { test_event_code: String(testEventCode) } : {}),
    };

    const res = await fetch(`https://graph.facebook.com/v21.0/${pixelId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const meta = await res.json();
    if (!res.ok) console.error("meta-capi rejected", JSON.stringify(meta));
    return json({ ok: res.ok });
  } catch (error) {
    console.error(error);
    return json({ ok: false, error: error instanceof Error ? error.message : "error" });
  }
});
