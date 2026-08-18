import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/** Só os domínios do projeto podem disparar eventos de conversão. */
const ORIGENS_PERMITIDAS = [
  /^https:\/\/[a-z0-9-]+\.lovable\.app$/,
  /^https:\/\/[a-z0-9-]+\.lovable\.dev$/,
  /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/,
  /^http:\/\/localhost(:\d+)?$/,
];

function corsFor(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const permitido = ORIGENS_PERMITIDAS.some((re) => re.test(origin));
  return {
    "Access-Control-Allow-Origin": permitido ? origin : "null",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    Vary: "Origin",
  };
}

/** Meta Conversions API — envia Purchase/Subscribe server-side. */
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

  try {
    const pixelId = Deno.env.get("META_PIXEL_ID") ?? "3161156880941929";
    const accessToken = Deno.env.get("META_CAPI_ACCESS_TOKEN");
    if (!accessToken) {
      return json({ ok: false, skipped: "META_CAPI_ACCESS_TOKEN missing" });
    }

    const body = await req.json();
    const eventName = String(body.event_name ?? "Purchase");
    const eventId = String(body.event_id ?? crypto.randomUUID());
    const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : undefined;
    const value = Number(body.value ?? 0);
    const currency = String(body.currency ?? "BRL");
    const customData = (body.custom_data ?? {}) as Record<string, unknown>;

    const sha256 = async (valor: string) => {
      const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(valor));
      return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
    };

    const userData: Record<string, unknown> = {};
    if (email) userData.em = [await sha256(email)];

    const phoneRaw = typeof body.phone === "string" ? body.phone.replace(/\D/g, "") : "";
    if (phoneRaw) userData.ph = [await sha256(phoneRaw)];

    // external_id: aceita valor já hasheado (64 hex) ou em texto puro.
    const externalId = typeof body.external_id === "string" ? body.external_id.trim() : "";
    if (externalId) {
      userData.external_id = [
        /^[a-f0-9]{64}$/i.test(externalId) ? externalId.toLowerCase() : await sha256(externalId),
      ];
    }

    const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ip = body.client_ip_address ?? forwarded;
    if (ip) userData.client_ip_address = ip;
    const ua = body.client_user_agent ?? req.headers.get("user-agent");
    if (ua) userData.client_user_agent = ua;
    if (body.fbp) userData.fbp = body.fbp;
    if (body.fbc) userData.fbc = body.fbc;

    // O Meta rejeita eventos sem identificador de cliente (erro 2804050).
    // Nesses casos o pixel do navegador já contabilizou o evento.
    const temIdentificador = Boolean(
      userData.em || userData.ph || userData.external_id || userData.fbp || userData.fbc,
    );
    if (!temIdentificador) {
      return json({ ok: false, skipped: "no user_data identifiers" });
    }

    const testEventCode = Deno.env.get("META_TEST_EVENT_CODE") ?? body.test_event_code;

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          action_source: "website",
          event_source_url: body.event_source_url ?? undefined,
          referrer_url: body.referrer_url ?? undefined,
          user_data: userData,
          custom_data: {
            currency,
            value,
            ...customData,
          },
        },
      ],
      ...(testEventCode ? { test_event_code: String(testEventCode) } : {}),
    };


    const url = `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const meta = await res.json();
    if (!res.ok) console.error("meta-capi rejected", JSON.stringify(meta));
    // Sempre 200: falha de tracking nunca deve virar erro de runtime no cliente.
    return json({ ok: res.ok, meta });
  } catch (error) {
    console.error(error);
    return json({ ok: false, error: error instanceof Error ? error.message : "error" });
  }
});
