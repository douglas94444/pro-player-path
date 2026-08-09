import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { captureUtmFromSearch } from "@/lib/utm";
import { trackMeta, trackMetaCustom } from "@/lib/meta-pixel";
import { usePlayer } from "@/lib/player-store";

export const Route = createFileRoute("/campanha")({
  validateSearch: (search: Record<string, unknown>) => ({
    utm_source: typeof search["utm_source"] === "string" ? (search["utm_source"] as string) : undefined,
    utm_medium: typeof search["utm_medium"] === "string" ? (search["utm_medium"] as string) : undefined,
    utm_campaign: typeof search["utm_campaign"] === "string" ? (search["utm_campaign"] as string) : undefined,
    utm_content: typeof search["utm_content"] === "string" ? (search["utm_content"] as string) : undefined,
    utm_term: typeof search["utm_term"] === "string" ? (search["utm_term"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Treine como atleta — Jogador PRO System" },
      {
        name: "description",
        content: "Plano guiado de 4 semanas para evoluir no futebol. Comece seu primeiro treino em menos de 1 minuto.",
      },
      { property: "og:title", content: "Jogador PRO System — treine como atleta" },
      {
        property: "og:description",
        content: "Base, controle, explosão e performance. Um treino por dia, sem enrolação.",
      },
    ],
  }),
  component: CampanhaPage,
});

function CampanhaPage() {
  const search = Route.useSearch();
  const { state, hydrated } = usePlayer();

  useEffect(() => {
    captureUtmFromSearch(search);
    trackMeta("ViewContent", {
      content_name: "landing_campanha",
      content_category: search.utm_campaign ?? "organic",
    });
    trackMetaCustom("LandingView", {
      utm_source: search.utm_source ?? "",
      utm_campaign: search.utm_campaign ?? "",
    });
  }, [search]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/30 via-background to-background" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-end px-5 pb-12 pt-16">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Jogador PRO System</p>
        <h1 className="mt-4 text-4xl font-black leading-tight text-foreground">
          Saiba exatamente o que treinar hoje
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Plano guiado de 4 semanas: base, controle, explosão e performance. Primeiro treino em menos de
          60 segundos.
        </p>
        <Button asChild size="lg" className="mt-8 h-14 w-full rounded-2xl text-base font-extrabold">
          {hydrated && state.onboardingDone ? (
            <Link to="/">Começar agora</Link>
          ) : (
            <Link to="/onboarding">Começar agora</Link>
          )}
        </Button>
        <Link
          to="/planos"
          search={{ from: "campanha" }}
          className="mt-4 text-center text-sm text-muted-foreground underline underline-offset-4"
        >
          Ver planos PRO
        </Link>
      </div>
    </main>
  );
}
