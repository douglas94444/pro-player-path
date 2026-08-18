import { createFileRoute } from "@tanstack/react-router";
import { CheckoutPage, type CheckoutSearch } from "@/components/CheckoutPage";
import { PLANOS_ASSINATURA } from "@/data/training";
import { RouteError, RouteNotFound } from "@/components/RouteBoundary";

export const Route = createFileRoute("/planos")({
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
  validateSearch: (search: Record<string, unknown>): CheckoutSearch => {
    const out: CheckoutSearch = {};
    if (typeof search["from"] === "string") out.from = search["from"];
    if (typeof search["checkout"] === "string") out.checkout = search["checkout"];
    if (typeof search["teaser"] === "string") out.teaser = search["teaser"];
    if (typeof search["ref"] === "string") out.ref = search["ref"];
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
  },
  head: () => ({
    meta: [
      { title: "Checkout PRO — Jogador PRO System" },
      {
        name: "description",
        content:
          "Assine no Mercado Pago: Pix ou cartão. Mensal R$47, semestral R$147 ou anual R$197. Garantia de 14 dias.",
      },
      { property: "og:title", content: "Liberar acesso PRO — Mercado Pago" },
      {
        property: "og:description",
        content: "Checkout transparente. Pix e cartão. Acesso na aprovação.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://ballstar-trainer.lovable.app/og-cover.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://ballstar-trainer.lovable.app/og-cover.jpg" },
    ],
  }),
  component: PlanosPage,
});

function PlanosPage() {
  const search = Route.useSearch();
  return <CheckoutPage search={search} />;
}
