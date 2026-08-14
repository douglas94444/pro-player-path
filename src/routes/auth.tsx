import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageFrame } from "@/components/PageFrame";
import { trackMeta } from "@/lib/meta-pixel";
import { RouteError, RouteNotFound } from "@/components/RouteBoundary";

export type AuthSearch = {
  from?: string;
  plano?: string;
};

export const Route = createFileRoute("/auth")({
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
  validateSearch: (search: Record<string, unknown>): AuthSearch => {
    const out: AuthSearch = {};
    if (typeof search["from"] === "string") out.from = search["from"];
    if (typeof search["plano"] === "string") out.plano = search["plano"];
    return out;
  },
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

function forcaSenha(senha: string) {
  let pontos = 0;
  if (senha.length >= 8) pontos++;
  if (senha.length >= 12) pontos++;
  if (/[a-z]/.test(senha) && /[A-Z]/.test(senha)) pontos++;
  if (/\d/.test(senha)) pontos++;
  if (/[^A-Za-z0-9]/.test(senha)) pontos++;
  const nivel = Math.min(3, Math.max(1, Math.ceil(pontos / 2)));
  return { nivel, label: nivel === 1 ? "Fraca" : nivel === 2 ? "Média" : "Forte" };
}

function ForcaSenha({ senha }: { senha: string }) {
  if (!senha) return null;
  const { nivel, label } = forcaSenha(senha);
  return (
    <div id="forca-senha" className="mt-2">
      <div className="flex gap-1" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i <= nivel ? (nivel === 1 ? "bg-destructive" : nivel === 2 ? "bg-amber-500" : "bg-primary") : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground" aria-live="polite">
        Força da senha: {label}
        {nivel < 3 ? " — use 12+ caracteres, maiúsculas, números e símbolos." : ""}
      </p>
    </div>
  );
}

function traduzErroAuth(mensagem: string) {
  const m = mensagem.toLowerCase();
  if (m.includes("already registered") || m.includes("user already"))
    return "Este e-mail já tem conta. Faça login ou use “Esqueci minha senha”.";
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (m.includes("password should be")) return "Senha muito curta. Use pelo menos 8 caracteres.";
  if (m.includes("rate limit") || m.includes("too many")) return "Muitas tentativas. Aguarde alguns minutos.";
  return mensagem;
}

function AuthPage() {
  const navigate = useNavigate();
  const { from, plano } = Route.useSearch();
  const [modo, setModo] = useState<"login" | "cadastro" | "recuperar">(from === "pos-treino" ? "cadastro" : "login");
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
      if (modo === "recuperar") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setMsg("Enviamos um link de redefinição para o seu e-mail. Confira também o spam.");
        return;
      }
      if (modo === "cadastro") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { emailRedirectTo: window.location.origin, data: { nome } },
        });
        if (error) throw error;
        if (data.user && (data.user.identities?.length ?? 0) === 0) {
          setErro("Este e-mail já tem conta. Faça login ou use “Esqueci minha senha”.");
          return;
        }
        trackMeta("CompleteRegistration", { content_name: "email_signup", status: true });
        if (!data.session) {
          setMsg("Conta criada! Confirme o e-mail que enviamos para começar a treinar.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
      }

      if (from === "planos") {
        await navigate({
          to: "/planos",
          search: {
            from: "auth",
            ...(plano ? { plano } : {}),
            checkout: "1",
          },
        });
        return;
      }
      if (from === "admin") {
        await navigate({ to: "/admin" });
        return;
      }
      await navigate({ to: "/app" });
    } catch (e) {
      setErro(traduzErroAuth(e instanceof Error ? e.message : "Não foi possível continuar. Tente novamente."));
    } finally {
      setLoading(false);
    }
  }


  return (
    <PageFrame max="sm" className="justify-center">
      <div className="w-full rounded-[1.75rem] border border-border/60 bg-card p-5 shadow-soft-lg sm:p-8">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>


        <h1 className="text-2xl font-extrabold leading-tight text-foreground sm:text-3xl">
          {modo === "login" ? "Bora treinar de novo" : modo === "cadastro" ? "Salve sua evolução" : "Recuperar acesso"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {modo === "recuperar"
            ? "Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha."
            : from === "planos"
            ? "Entre para continuar o checkout da assinatura PRO."
            : from === "admin"
              ? "Entre com uma conta admin para acessar o painel."
              : from === "pos-treino"
                ? "Crie sua conta agora e não perca o streak deste dispositivo."
                : "Sua conta guarda streak, plano guiado e histórico de treinos."}
        </p>
        {plano ? <p className="mt-1 text-xs text-primary">Plano selecionado: {plano}</p> : null}

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          {modo === "cadastro" ? (
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
                className="mt-2"
                required
              />
            </div>
          ) : null}
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              className="mt-2"
              required
            />
          </div>
          {modo !== "recuperar" ? (
            <div>
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="mínimo 8 caracteres"
                minLength={modo === "cadastro" ? 8 : 6}
                className="mt-2"
                required
                aria-describedby={modo === "cadastro" ? "forca-senha" : undefined}
              />
              {modo === "cadastro" ? <ForcaSenha senha={senha} /> : null}
            </div>
          ) : null}


          {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
          {msg ? <p className="text-sm text-primary">{msg}</p> : null}

          <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl font-extrabold">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : modo === "login" ? (
              "Entrar"
            ) : modo === "cadastro" ? (
              "Criar conta"
            ) : (
              "Enviar link de redefinição"
            )}
          </Button>
        </form>

        <div className="mt-6 flex flex-col items-start gap-2">
          <button
            type="button"
            onClick={() => {
              setModo(modo === "cadastro" ? "login" : "cadastro");
              setErro(null);
              setMsg(null);
            }}
            className="text-sm text-muted-foreground underline underline-offset-4"
          >
            {modo === "cadastro" ? "Já tenho conta" : "Ainda não tenho conta"}
          </button>
          <button
            type="button"
            onClick={() => {
              setModo(modo === "recuperar" ? "login" : "recuperar");
              setErro(null);
              setMsg(null);
            }}
            className="text-sm text-muted-foreground underline underline-offset-4"
          >
            {modo === "recuperar" ? "Voltar para o login" : "Esqueci minha senha"}
          </button>
        </div>

      </div>
    </PageFrame>
  );
}
