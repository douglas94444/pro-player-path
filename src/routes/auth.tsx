import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — Jogador PRO System" },
      {
        name: "description",
        content: "Acesse sua conta do Jogador PRO System e sincronize treinos, streak e evolução em qualquer aparelho.",
      },
      { property: "og:title", content: "Entrar no Jogador PRO System" },
      { property: "og:description", content: "Sincronize seu progresso de treinos na sua conta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"login" | "cadastro">("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    setMsg(null);
    try {
      if (modo === "cadastro") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { emailRedirectTo: window.location.origin, data: { nome } },
        });
        if (error) throw error;
        if (!data.session) {
          setMsg("Conta criada! Confirme o e-mail que enviamos para começar a treinar.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
      }
      await navigate({ to: "/" });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível continuar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
      <Link to="/" className="mb-8 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <h1 className="text-3xl font-extrabold leading-tight text-foreground">
        {modo === "login" ? "Bora treinar de novo" : "Comece sua evolução"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sua conta guarda streak, plano guiado e histórico de treinos.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {modo === "cadastro" ? (
          <div>
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" className="mt-2" required />
          </div>
        ) : null}
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" className="mt-2" required />
        </div>
        <div>
          <Label htmlFor="senha">Senha</Label>
          <Input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="mínimo 6 caracteres" minLength={6} className="mt-2" required />
        </div>

        {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
        {msg ? <p className="text-sm text-primary">{msg}</p> : null}

        <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl font-extrabold">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : modo === "login" ? "Entrar" : "Criar conta"}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => {
          setModo(modo === "login" ? "cadastro" : "login");
          setErro(null);
          setMsg(null);
        }}
        className="mt-6 text-sm text-muted-foreground underline underline-offset-4"
      >
        {modo === "login" ? "Ainda não tenho conta" : "Já tenho conta"}
      </button>
    </main>
  );
}
