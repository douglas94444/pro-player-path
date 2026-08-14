import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LandingPage, validateLandingSearch, type LandingSearch } from "@/components/LandingPage";
import { usePlayer } from "@/lib/player-store";
import { useEffect } from "react";
import { RouteError, RouteNotFound } from "@/components/RouteBoundary";

export const Route = createFileRoute("/")({
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
  validateSearch: (search: Record<string, unknown>): LandingSearch => validateLandingSearch(search),
  head: () => ({
    meta: [
      { title: "Pare de treinar sem resultado — Jogador PRO System" },
      {
        name: "description",
        content:
          "Siga um plano pronto e evolua como jogador em poucas semanas. Treinos guiados de 10 a 20 minutos, mesmo treinando sozinho.",
      },
      { property: "og:title", content: "Pare de treinar sem resultado — Jogador PRO System" },
      {
        property: "og:description",
        content: "Plano guiado de 4 semanas. Comece agora por R$47.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://ballstar-trainer.lovable.app/og-cover.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://ballstar-trainer.lovable.app/og-cover.jpg" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const search = Route.useSearch();
  const { logado, state } = usePlayer();
  const navigate = useNavigate();

  // Usuários logados e PRO vão direto para o app; landing fica pública para visitantes.
  useEffect(() => {
    if (logado && state.assinante) {
      void navigate({ to: "/app", replace: true });
    }
  }, [logado, state.assinante, navigate]);

  return <LandingPage search={search} />;
}
