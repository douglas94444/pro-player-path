import { createFileRoute, redirect } from "@tanstack/react-router";
import { validateLandingSearch } from "@/components/LandingPage";
import { RouteError } from "@/components/RouteBoundary";

export const Route = createFileRoute("/planos")({
  errorComponent: RouteError,
  validateSearch: (search: Record<string, unknown>) => validateLandingSearch(search),
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/", search, hash: "oferta", replace: true });
  },
  component: () => null,
});
