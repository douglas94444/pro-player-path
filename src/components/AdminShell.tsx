import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { LayoutDashboard, Users, Dumbbell, CreditCard, ArrowLeft, Video, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/admin" as const, label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/usuarios" as const, label: "Usuários", icon: Users, exact: false },
  { to: "/admin/sessoes" as const, label: "Sessões", icon: Dumbbell, exact: false },
  { to: "/admin/videos" as const, label: "Vídeos", icon: Video, exact: false },
  { to: "/admin/sugestoes" as const, label: "Sugestões", icon: MessageSquare, exact: false },
  { to: "/admin/pagamentos" as const, label: "Pagamentos", icon: CreditCard, exact: false },
];

export function AdminShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border/60 bg-card px-4 py-6 shadow-soft md:flex">
        <div className="mb-8 px-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Admin</p>
          <p className="mt-1 text-sm font-semibold text-foreground">Jogador PRO</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {items.map(({ to, label, icon: Icon, exact }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact }}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors data-[status=active]:bg-primary/10 data-[status=active]:text-primary"
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </nav>
        <Link
          to="/app"
          className="mt-4 inline-flex items-center gap-2 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao app
        </Link>
      </aside>

      {/* Mobile top nav */}
      <nav className="sticky top-0 z-40 border-b border-border bg-card/95 px-3 py-2 backdrop-blur md:hidden">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Admin</p>
          <Link to="/app" className="text-xs text-muted-foreground">
            App
          </Link>
        </div>

        <div className="mt-2 flex gap-1 overflow-x-auto pb-1">
          {items.map(({ to, label, exact }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact }}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold text-muted-foreground data-[status=active]:border-primary data-[status=active]:bg-primary/10 data-[status=active]:text-primary",
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>

      <div className="relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 md:pl-64 md:pr-8 md:pt-10">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </header>
        {children}
      </div>
    </div>
  );
}
