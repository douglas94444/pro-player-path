import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { CAMPANHA } from "@/data/campanha-copy";
import { cn } from "@/lib/utils";

export function TopBar({ onAssinar, logado }: { onAssinar: () => void; logado: boolean }) {
  const [solido, setSolido] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolido(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        solido ? "border-b border-border/60 bg-background/90 shadow-soft backdrop-blur" : "bg-transparent",
      )}
    >
      <div className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3 sm:px-8">
        <p className="min-w-0 truncate text-sm font-black uppercase tracking-[0.16em] text-primary sm:text-base">
          {CAMPANHA.brand}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          {logado ? null : (
            <Button asChild variant="ghost" size="sm" className="h-9 px-3 text-xs font-bold sm:text-sm">
              <Link to="/auth">Entrar</Link>
            </Button>
          )}
          <Button size="sm" className="h-9 px-4 text-xs font-extrabold sm:text-sm" onClick={onAssinar}>
            Assinar
          </Button>
        </div>
      </div>
    </header>
  );
}
