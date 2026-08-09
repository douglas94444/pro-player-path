import { Link } from "@tanstack/react-router";
import { Home, CalendarDays, Dumbbell, TrendingUp, User } from "lucide-react";
import { usePlayer } from "@/lib/player-store";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/plano", label: "Plano", icon: CalendarDays },
  { to: "/biblioteca", label: "Treinos", icon: Dumbbell },
  { to: "/progresso", label: "Evolução", icon: TrendingUp },
  { to: "/perfil", label: "Perfil", icon: User, badgeKey: "perfil" as const },
] as const;

export function BottomNav() {
  const { logado, state } = usePlayer();
  const showPerfilBadge = !logado || !state.assinante;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2 py-2">
        {items.map(({ to, label, icon: Icon, ...rest }) => {
          const badge = "badgeKey" in rest && rest.badgeKey === "perfil" && showPerfilBadge;
          return (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="relative flex flex-1 flex-col items-center gap-1 rounded-lg py-1 text-[11px] font-medium text-muted-foreground transition-colors data-[status=active]:text-primary"
            >
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
      </div>
    </nav>
  );
}
