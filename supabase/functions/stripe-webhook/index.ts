import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(() =>
  new Response(
    JSON.stringify({
      error: "deprecated",
      message: "Stripe removido. Use mercadopago-webhook.",
    }),
    { status: 410, headers: { "Content-Type": "application/json" } },
  ),
);
