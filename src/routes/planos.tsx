import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export type PlanosSearch = {
  from?: string;
  checkout?: string;
  plano?: string;
  teaser?: string;
  ref?: string;
};

export const Route = createFileRoute("/planos")({
  validateSearch: (search: Record<string, unknown>): PlanosSearch => {
    const out: PlanosSearch = {};
    if (typeof search["from"] === "string") out.from = search["from"];
    if (typeof search["checkout"] === "string") out.checkout = search["checkout"];
    if (typeof search["teaser"] === "string") out.teaser = search["teaser"];
    if (typeof search["ref"] === "string") out.ref = search["ref"];
    if (typeof search["plano"] === "string") out.plano = search["plano"];
    return out;
  },
  head: () => ({
    meta: [
      { title: "Planos e assinatura — Jogador PRO System" },
      {
        name: "description",
        content: "Mensal R$47, semestral R$147 ou anual R$197. Acesso completo ao plano guiado.",
      },
      { property: "og:title", content: "Comece a treinar como atleta hoje" },
      { property: "og:description", content: "Assine e destrave o plano guiado completo do Jogador PRO System." },
    ],
  }),
  component: PlanosRedirect,
});

function PlanosRedirect() {
  const navigate = useNavigate();
  const { from, checkout, plano, teaser, ref } = Route.useSearch();

  useEffect(() => {
    const search: PlanosSearch = {};
    if (from) search.from = from;
    if (checkout) search.checkout = checkout;
    if (plano) search.plano = plano;
    if (teaser) search.teaser = teaser;
    if (ref) search.ref = ref;
    void navigate({
      to: "/",
      search,
      replace: true,
    });
  }, [navigate, from, checkout, plano, teaser, ref]);


  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Redirecionando…</p>
    </div>
  );
}
