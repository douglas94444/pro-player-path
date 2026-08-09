import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePlayer } from "@/lib/player-store";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil do jogador — Jogador PRO System" },
      { name: "description", content: "Seu nome, nível atual, plano ativo e preferências da conta." },
      { property: "og:title", content: "Perfil do jogador" },
      { property: "og:description", content: "Gerencie seu nível, plano e dados de treino." },
    ],
  }),
  component: PerfilPage,
});

function PerfilPage() {
  const { state, nivel, totalTreinos, setNome, cancelar, reset, logado, email, sair } = usePlayer();

  return (
    <AppShell title="Perfil" subtitle={`Jogador ${nivel} · ${totalTreinos} treinos`}>
      <section className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Conta</p>
        {logado ? (
          <>
            <p className="mt-2 text-sm font-semibold text-foreground">{email}</p>
            <p className="text-xs text-muted-foreground">Progresso sincronizado na nuvem.</p>
            <Button variant="outline" className="mt-4 w-full rounded-xl" onClick={() => void sair()}>
              Sair da conta
            </Button>
          </>
        ) : (
          <>
            <p className="mt-2 text-xs text-muted-foreground">
              Você está como visitante. Crie sua conta para sincronizar treinos e streak em qualquer aparelho.
            </p>
            <Button asChild className="mt-4 h-12 w-full rounded-xl font-extrabold">
              <Link to="/auth">Entrar ou criar conta</Link>
            </Button>
          </>
        )}
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-card p-5">
        <Label htmlFor="nome" className="text-xs uppercase tracking-widest text-muted-foreground">
          Seu nome
        </Label>
        <Input id="nome" value={state.nome} onChange={(e) => setNome(e.target.value)} className="mt-2" />
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-card p-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Plano ativo</p>
        <p className="mt-2 text-lg font-extrabold text-foreground">
          {state.assinante ? `Assinatura ${state.plano}` : "Gratuito (acesso limitado)"}
        </p>
        {state.assinante ? (
          <Button variant="outline" className="mt-4 w-full rounded-xl" onClick={cancelar}>
            Cancelar assinatura
          </Button>
        ) : (
          <Button asChild className="mt-4 h-12 w-full rounded-xl font-extrabold">
            <Link to="/planos">Liberar acesso completo</Link>
          </Button>
        )}
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-card p-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Dados</p>
        <p className="mt-2 text-xs text-muted-foreground">
          {logado ? "Seu histórico fica salvo na sua conta." : "Seu progresso está salvo neste dispositivo."}
        </p>
        <Button variant="ghost" className="mt-3 w-full text-destructive" onClick={reset}>
          Zerar progresso
        </Button>
      </section>
    </AppShell>
  );
}

