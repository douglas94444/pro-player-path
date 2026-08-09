import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/use-auth";
import { ensureAdminRole } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Jogador PRO System" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancel = false;

    async function gate() {
      if (loading) return;
      if (!user) {
        void navigate({ to: "/auth", search: { from: "admin" } });
        return;
      }

      try {
        await ensureAdminRole();
        const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
        if (cancel) return;
        if (data?.role !== "admin") {
          void navigate({ to: "/" });
          return;
        }
        setAllowed(true);
      } catch {
        if (!cancel) void navigate({ to: "/" });
      } finally {
        if (!cancel) setChecking(false);
      }
    }

    void gate();
    return () => {
      cancel = true;
    };
  }, [user, loading, navigate]);

  if (loading || checking || !allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Verificando acesso admin…</p>
      </div>
    );
  }

  return <Outlet />;
}
