import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  return new Response(
    JSON.stringify({
      error: "deprecated",
      message: "Stripe removido. Use process-payment (Mercado Pago Checkout Transparente).",
    }),
    { status: 410, headers: { ...cors, "Content-Type": "application/json" } },
  );
});
