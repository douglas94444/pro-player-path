import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { cn } from "@/lib/utils";

export function AppShell({
  title,
  subtitle,
  action,
  children,
  wide = false,
  hideNav = false,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  /** Conteúdo mais largo no desktop (biblioteca, plano). */
  wide?: boolean;
  /** Oculta a navegação inferior/lateral (útil para landing pages). */
  hideNav?: boolean;
}) {
  return (
    <div className="relative min-h-screen bg-background">
      {hideNav ? null : <BottomNav />}
      <div
        className={cn(
          "relative mx-auto w-full px-4 pb-32 pt-8 sm:px-6 md:pb-12 md:pt-10 lg:pr-10",
          hideNav ? "md:pl-8" : "md:pl-64",
          wide ? "max-w-6xl" : "max-w-3xl",
        )}
      >
        <header className="mb-7 flex flex-wrap items-start justify-between gap-3 sm:mb-9 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">{title}</h1>
            {subtitle ? (
              <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">{subtitle}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
        {children}
      </div>
    </div>
  );
}

