import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkoutEmailRedirect, garantirSessaoAposCadastro, traduzErroAuth } from "@/lib/checkout";
import { forcaSenha } from "@/lib/auth-ui";
import { cpfValido, maskCpf, maskPhone, phoneValido, soDigitos } from "@/lib/br-docs";
import { trackMetaDedup } from "@/lib/meta-pixel";

const LOGIN_EVENT = "jps:checkout-login";

export function pedirLoginCheckout() {
  window.dispatchEvent(new Event(LOGIN_EVENT));
}

export type CheckoutDados = { nome: string; cpf: string; phone: string };

async function salvarDocs(userId: string, nome: string, cpf: string, phone: string) {
  const payload: { id: string; cpf: string; phone: string; nome?: string } = {
    id: userId,
    cpf,
    phone,
  };
  if (nome) payload.nome = nome;
  const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
  if (error) throw error;
}

export function CheckoutAuth({
  plano,
  onAuthenticated,
  onDados,
  formId = "checkout-dados",
  hideSubmit = false,
  inicial = "cadastro",
}: {
  plano: string;
  onAuthenticated: () => void;
  onDados?: (dados: CheckoutDados) => void;
  formId?: string;
  hideSubmit?: boolean;
  inicial?: "cadastro" | "login" | "completar";
}) {
  const [modo, setModo] = useState<"cadastro" | "login" | "completar">(inicial);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const forca = forcaSenha(senha);

  useEffect(() => {
    const abrirLogin = () => {
      setModo("login");
      setErro(null);
      setMsg(null);
    };
    window.addEventListener(LOGIN_EVENT, abrirLogin);
    return () => window.removeEventListener(LOGIN_EVENT, abrirLogin);
  }, []);

  async function concluirComDocs(userId: string, nomeFinal: string, cpfDigits: string, phoneDigits: string) {
    await salvarDocs(userId, nomeFinal, cpfDigits, phoneDigits);
    onDados?.({ nome: nomeFinal, cpf: cpfDigits, phone: phoneDigits });
    onAuthenticated();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    setMsg(null);
    try {
      if (modo === "completar") {
        const cpfDigits = soDigitos(cpf);
        const phoneDigits = soDigitos(phone);
        if (!cpfValido(cpfDigits)) throw new Error("Informe um CPF válido.");
        if (!phoneValido(phoneDigits)) throw new Error("Informe um celular válido.");
        const { data } = await supabase.auth.getUser();
        const userId = data.user?.id;
        if (!userId) throw new Error("Sessão expirada. Entre de novo.");
        await concluirComDocs(userId, nome, cpfDigits, phoneDigits);
        return;
      }

      if (modo === "cadastro") {
        const cpfDigits = soDigitos(cpf);
        const phoneDigits = soDigitos(phone);
        if (!cpfValido(cpfDigits)) throw new Error("Informe um CPF válido.");
        if (!phoneValido(phoneDigits)) throw new Error("Informe um celular válido.");
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: {
            emailRedirectTo: checkoutEmailRedirect(window.location.origin, plano),
            data: { nome },
          },
        });
        if (error) throw error;
        if (data.user && (data.user.identities?.length ?? 0) === 0) {
          setErro("Este e-mail já tem conta. Entre para continuar o pagamento.");
          setModo("login");
          return;
        }
        trackMetaDedup("CompleteRegistration", { content_name: "checkout_signup", status: true });
        let userId = data.session && data.user ? data.user.id : null;
        if (!userId) {
          const extra = await garantirSessaoAposCadastro(email, senha);
          userId = extra.session?.user.id ?? null;
          if (!userId) {
            setMsg(
              extra.precisaConfirmarEmail
                ? "Conta criada. Abra o e-mail de confirmação (o link volta para este pagamento) e toque em Já confirmei."
                : "Conta criada. Entre com o mesmo e-mail para abrir o pagamento.",
            );
            setModo("login");
            return;
          }
        }
        await concluirComDocs(userId, nome, cpfDigits, phoneDigits);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) throw error;
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Não foi possível confirmar a sessão.");
      const { data: perfil } = await supabase.from("profiles").select("cpf, phone, nome").eq("id", userId).maybeSingle();
      const cpfDigits = soDigitos(cpf) || perfil?.cpf || "";
      const phoneDigits = soDigitos(phone) || perfil?.phone || "";
      if (!cpfValido(cpfDigits) || !phoneValido(phoneDigits)) {
        setModo("completar");
        if (perfil?.nome && !nome) setNome(perfil.nome);
        if (perfil?.cpf) setCpf(maskCpf(perfil.cpf));
        if (perfil?.phone) setPhone(maskPhone(perfil.phone));
        setErro("Complete CPF e celular para pagar.");
        return;
      }
      await concluirComDocs(userId, nome || perfil?.nome || "", cpfDigits, phoneDigits);
    } catch (err) {
      setErro(traduzErroAuth(err instanceof Error ? err.message : "Não foi possível continuar. Tente novamente."));
    } finally {
      setLoading(false);
    }
  }

  const titulo =
    modo === "cadastro" ? "Crie sua conta para pagar" : modo === "login" ? "Entre para pagar" : "Complete seus dados";
  const subtitulo =
    modo === "completar"
      ? "CPF e celular são usados no Pix e no comprovante."
      : "Sem redirecionar: depois do login o Mercado Pago abre aqui mesmo.";

  return (
    <div className="text-left">
      {!hideSubmit ? (
        <>
          <p className="text-sm font-extrabold text-foreground">{titulo}</p>
          <p className="mt-1 text-xs text-muted-foreground">{subtitulo}</p>
        </>
      ) : modo === "completar" ? (
        <p className="mb-3 text-sm text-muted-foreground">{subtitulo}</p>
      ) : null}

      <form id={formId} onSubmit={onSubmit} className={hideSubmit ? "space-y-3" : "mt-4 space-y-3"}>
        {modo === "cadastro" || modo === "completar" ? (
          <div>
            <Label htmlFor="checkout-nome">Nome *</Label>
            <Input
              id="checkout-nome"
              name="name"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome completo"
              className="mt-1.5 h-11"
              required={modo === "cadastro"}
              autoComplete="name"
            />
          </div>
        ) : null}
        {modo !== "completar" ? (
          <div>
            <Label htmlFor="checkout-email">E-mail *</Label>
            <Input
              id="checkout-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              className="mt-1.5 h-11"
              required
              autoComplete="email"
            />
          </div>
        ) : null}
        {modo === "cadastro" || modo === "completar" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="checkout-cpf">CPF *</Label>
              <Input
                id="checkout-cpf"
                name="cpf"
                value={cpf}
                onChange={(e) => setCpf(maskCpf(e.target.value))}
                placeholder="000.000.000-00"
                inputMode="numeric"
                autoComplete="off"
                className="mt-1.5 h-11"
                required
              />
            </div>
            <div>
              <Label htmlFor="checkout-phone">Celular *</Label>
              <Input
                id="checkout-phone"
                name="tel"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(maskPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                inputMode="tel"
                autoComplete="tel"
                className="mt-1.5 h-11"
                required
              />
            </div>
          </div>
        ) : null}
        {modo !== "completar" ? (
          <div>
            <Label htmlFor="checkout-senha">Senha *</Label>
            <Input
              id="checkout-senha"
              name="password"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="mínimo 8 caracteres"
              minLength={modo === "cadastro" ? 8 : 6}
              className="mt-1.5 h-11"
              required
              autoComplete={modo === "cadastro" ? "new-password" : "current-password"}
              aria-describedby={modo === "cadastro" ? "checkout-forca-senha" : undefined}
            />
            {modo === "cadastro" && senha ? (
              <p id="checkout-forca-senha" className="mt-1 text-[11px] text-muted-foreground">
                Força da senha: {forca.label}
              </p>
            ) : null}
          </div>
        ) : null}

        {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
        {msg ? <p className="text-sm text-primary">{msg}</p> : null}
        {hideSubmit && loading ? (
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Preparando seu pagamento…
          </p>
        ) : null}

        {hideSubmit ? null : (
          <Button type="submit" disabled={loading} className="h-12 w-full font-extrabold">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : modo === "cadastro" ? (
              "Criar conta e pagar"
            ) : modo === "login" ? (
              "Entrar e pagar"
            ) : (
              "Salvar e pagar"
            )}
          </Button>
        )}
      </form>

      {modo === "completar" ? null : (
        <button
          type="button"
          onClick={() => {
            setModo(modo === "cadastro" ? "login" : "cadastro");
            setErro(null);
            setMsg(null);
          }}
          className="mt-3 text-xs font-semibold text-muted-foreground underline underline-offset-4"
        >
          {modo === "cadastro" ? "Já tenho conta" : "Ainda não tenho conta"}
        </button>
      )}
      {modo === "login" ? (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Esqueceu a senha?{" "}
          <Link to="/auth" search={{ from: "checkout", plano }} className="font-semibold underline underline-offset-4">
            Recuperar acesso
          </Link>
        </p>
      ) : null}
    </div>
  );
}
