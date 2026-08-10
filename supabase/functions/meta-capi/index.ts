import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Meta Conversions API — envia Purchase/Subscribe server-side. */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const pixelId = Deno.env.get("META_PIXEL_ID") ?? "3161156880941929";
    const accessToken = Deno.env.get("META_CAPI_ACCESS_TOKEN");
    if (!accessToken) {
      return new Response(JSON.stringify({ ok: false, skipped: "META_CAPI_ACCESS_TOKEN missing" }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const eventName = String(body.event_name ?? "Purchase");
    const eventId = String(body.event_id ?? crypto.randomUUID());
    const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : undefined;
    const value = Number(body.value ?? 0);
    const currency = String(body.currency ?? "BRL");
    const customData = (body.custom_data ?? {}) as Record<string, unknown>;

    const userData: Record<string, unknown> = {};
    if (email) {
      const enc = new TextEncoder();
      const hash = await crypto.subtle.digest("SHA-256", enc.encode(email));
      userData.em = [Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("")];
    }
    if (body.client_ip_address) userData.client_ip_address = body.client_ip_address;
    if (body.client_user_agent) userData.client_user_agent = body.client_user_agent;
    if (body.fbp) userData.fbp = body.fbp;
    if (body.fbc) userData.fbc = body.fbc;

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          action_source: "website",
          user_data: userData,
          custom_data: {
            currency,
            value,
            ...customData,
          },
        },
      ],
    };

    const url = `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return new Response(JSON.stringify({ ok: res.ok, meta: json }), {
      status: res.ok ? 200 : 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "error" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
