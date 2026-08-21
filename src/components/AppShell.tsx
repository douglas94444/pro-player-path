import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { BotaoSair } from "./BotaoSair";
import { cn } from "@/lib/utils";

export type AppShellProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  wide?: boolean;
  hideNav?: boolean;
};

export function AppShell({
  title,
  subtitle,
  action,
  children,
  wide = false,
  hideNav = false,
}: AppShellProps) {
  return (
    <div className="relative min-h-screen bg-background">
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>
      {hideNav ? null : <BottomNav />}
      <div
        id="conteudo-principal"
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
          <div className="flex shrink-0 items-center gap-2">
            {action}
            <BotaoSair className="md:hidden" />
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

