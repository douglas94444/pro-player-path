import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageFrame } from "@/components/PageFrame";
import { RouteError, RouteNotFound } from "@/components/RouteBoundary";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
  head: () => ({
    meta: [
      { title: "Redefinir senha — Jogador PRO System" },
      {
        name: "description",
        content: "Crie uma nova senha para voltar a treinar e sincronizar sua evolução no Jogador PRO System.",
      },
      { property: "og:title", content: "Redefinir senha — Jogador PRO System" },
      { property: "og:description", content: "Defina uma nova senha de acesso à sua conta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [pronto, setPronto] = useState(false);
  const [semSessao, setSemSessao] = useState(false);
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        if (!ativo) return;
        setSemSessao(false);
        setPronto(true);
      }
    });
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!ativo) return;
      setPronto(true);
      setSemSessao(!data.session);
    })();
    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setMsg(null);
    if (senha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: senha });
      if (error) throw error;
      setMsg("Senha atualizada! Redirecionando...");
      setTimeout(() => {
        void navigate({ to: "/app" });
      }, 1200);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível atualizar a senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageFrame max="sm" className="justify-center">
      <div className="w-full rounded-[1.75rem] border border-border/60 bg-card p-5 shadow-soft-lg sm:p-8">
        <Link
          to="/auth"
          search={{}}
          className="mb-6 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao login
        </Link>

        <h1 className="text-2xl font-extrabold leading-tight text-foreground sm:text-3xl">Nova senha</h1>

        {!pronto ? (
          <p className="mt-4 text-sm text-muted-foreground">Validando seu link...</p>
        ) : semSessao ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Link inválido ou expirado. Peça um novo e-mail de redefinição na tela de login.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="senha">Nova senha</Label>
              <Input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="mínimo 6 caracteres"
                minLength={6}
                className="mt-2"
                required
              />
            </div>
            <div>
              <Label htmlFor="confirmar">Confirmar senha</Label>
              <Input
                id="confirmar"
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                placeholder="repita a senha"
                minLength={6}
                className="mt-2"
                required
              />
            </div>

            {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
            {msg ? <p className="text-sm text-primary">{msg}</p> : null}

            <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl font-extrabold">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar nova senha"}
            </Button>
          </form>
        )}
      </div>
    </PageFrame>
  );
}
