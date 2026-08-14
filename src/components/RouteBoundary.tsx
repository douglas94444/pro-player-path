import { Link, useRouter } from "@tanstack/react-router";
import { AlertTriangle, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Boundary de erro reutilizável por rota. */
export function RouteError({ error, reset }: { error: Error; reset?: () => void }) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-[1.5rem] border border-border/60 bg-card p-8 text-center shadow-soft">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-xl font-extrabold text-foreground">Algo saiu do lugar</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Não conseguimos carregar esta tela agora. Verifique sua conexão e tente de novo.
        </p>
        <p className="mt-2 break-words text-[11px] text-muted-foreground/70">{error.message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button
            onClick={() => {
              void router.invalidate();
              reset?.();
            }}
          >
            Tentar de novo
          </Button>
          <Button asChild variant="outline">
            <Link to="/app">Ir para o app</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

/** 404 reutilizável por rota. */
export function RouteNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-[1.5rem] border border-border/60 bg-card p-8 text-center shadow-soft">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Compass className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-xl font-extrabold text-foreground">Conteúdo não encontrado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          O que você procurava saiu do ar ou mudou de endereço.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link to="/app">Voltar ao início</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/biblioteca">Ver treinos</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
