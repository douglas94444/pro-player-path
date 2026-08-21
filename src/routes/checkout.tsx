import { createFileRoute } from "@tanstack/react-router";
import { CheckoutPagamento } from "@/components/CheckoutPagamento";
import { parseCheckoutSearch } from "@/lib/checkout";
import { RouteError, RouteNotFound } from "@/components/RouteBoundary";

export const Route = createFileRoute("/checkout")({
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
  validateSearch: parseCheckoutSearch,
  head: () => ({
    meta: [
      { title: "Checkout PRO — Jogador PRO System" },
      {
        name: "description",
        content:
          "Assine com Pix ou cartão. Semestral R$147, anual R$197 ou mensal R$47. Garantia de 14 dias.",
      },
      { property: "og:title", content: "Liberar acesso PRO" },
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
  component: CheckoutRoute,
});

function CheckoutRoute() {
  const search = Route.useSearch();
  return <CheckoutPagamento search={search} />;
}
