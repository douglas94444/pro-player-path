import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto w-full max-w-md px-5 pt-8">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          {action}
        </header>
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
