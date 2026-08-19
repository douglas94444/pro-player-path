import { createFileRoute, redirect } from "@tanstack/react-router";
import { validateLandingSearch, type LandingSearch } from "@/components/LandingPage";
import { RouteError } from "@/components/RouteBoundary";

export type CampanhaSearch = LandingSearch;

export const Route = createFileRoute("/campanha")({
  errorComponent: RouteError,
  validateSearch: (search: Record<string, unknown>): CampanhaSearch => validateLandingSearch(search),
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/", search, replace: true });
  },
  component: () => null,
});
