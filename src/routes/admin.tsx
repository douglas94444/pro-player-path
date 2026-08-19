import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { ensureAdminRole } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";
import { RouteError, RouteNotFound } from "@/components/RouteBoundary";

export const Route = createFileRoute("/admin")({
  ssr: false,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
  head: () => ({
    meta: [
      { title: "Admin — Jogador PRO System" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw redirect({ to: "/auth", search: { from: "admin" } });
    }
    await ensureAdminRole();
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", sessionData.session.user.id)
      .maybeSingle();
    if (data?.role !== "admin") {
      throw redirect({ to: "/app" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  return <Outlet />;
}
