import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Frame centrado para telas sem AppShell (auth, onboarding, treino, campanha). */
export function PageFrame({
  children,
  className,
  max = "md",
}: {
  children: ReactNode;
  className?: string;
  max?: "sm" | "md" | "lg";
}) {
  const maxClass =
    max === "sm" ? "max-w-md" : max === "lg" ? "max-w-3xl" : "max-w-lg";

  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.78_0.2_141_/_0.12),_transparent_55%)]" />
      <div
        className={cn(
          "relative mx-auto flex min-h-screen w-full flex-col px-4 py-8 sm:px-6 sm:py-10 md:py-14",
          maxClass,
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
