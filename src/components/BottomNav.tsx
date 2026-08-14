import { Link } from "@tanstack/react-router";
import { Home, CalendarDays, Dumbbell, TrendingUp, User } from "lucide-react";
import { usePlayer } from "@/lib/player-store";
import { cn } from "@/lib/utils";

const items = [
  { to: "/app", label: "Home", icon: Home },
  { to: "/plano", label: "Plano", icon: CalendarDays },
  { to: "/biblioteca", label: "Treinos", icon: Dumbbell },
  { to: "/progresso", label: "Evolução", icon: TrendingUp },
  { to: "/perfil", label: "Perfil", icon: User, badgeKey: "perfil" as const },
] as const;


function NavLinks({ orientation }: { orientation: "horizontal" | "vertical" }) {
  const { logado, state } = usePlayer();
  const showPerfilBadge = !logado || !state.assinante;
  const vertical = orientation === "vertical";

  return (
    <>
      {items.map(({ to, label, icon: Icon, ...rest }) => {
        const badge = "badgeKey" in rest && rest.badgeKey === "perfil" && showPerfilBadge;
        return (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            className={cn(
              "group relative flex items-center font-semibold text-muted-foreground transition-colors",
              "data-[status=active]:text-primary",
              vertical
                ? "w-full gap-3 rounded-2xl px-3 py-2.5 text-[13px] data-[status=active]:bg-accent"
                : "flex-1 flex-col gap-0.5 rounded-full px-1 py-1.5 text-[10px] data-[status=active]:bg-primary/15",
            )}
          >
            {vertical ? (
              <span
                className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-transparent group-data-[status=active]:bg-primary"
                aria-hidden
              />
            ) : null}
            <span className="relative">
              <Icon className="h-5 w-5" />
              {badge ? (
                <span className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-primary" aria-hidden />
              ) : null}
            </span>
            {label}
          </Link>
        );
      })}
    </>
  );
}

/** Bottom tabs no mobile; sidebar fixa no desktop. */
export function BottomNav() {
  return (
    <>
      {/* Mobile — pill flutuante */}
      <nav className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-between gap-0.5 rounded-full border border-border/80 bg-card/90 px-2 py-1.5 shadow-soft-lg backdrop-blur-xl">
          <NavLinks orientation="horizontal" />
        </div>
      </nav>

      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 shadow-soft md:flex">
        <div className="mb-8 px-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Jogador PRO</p>
          <p className="mt-1 text-sm font-semibold text-foreground">System</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 pl-1">
          <NavLinks orientation="vertical" />
        </nav>
        <p className="px-2 text-[11px] text-muted-foreground">Treine como atleta, todo dia.</p>
      </aside>
    </>
  );
}
