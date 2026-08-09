import { Link } from "@tanstack/react-router";
import { Home, CalendarDays, Dumbbell, TrendingUp, User } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/plano", label: "Plano", icon: CalendarDays },
  { to: "/biblioteca", label: "Treinos", icon: Dumbbell },
  { to: "/progresso", label: "Evolução", icon: TrendingUp },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2 py-2">
        {items.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            className="flex flex-1 flex-col items-center gap-1 rounded-lg py-1 text-[11px] font-medium text-muted-foreground transition-colors data-[status=active]:text-primary"
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
