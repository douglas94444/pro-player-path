import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Clock, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MercadoPagoCheckout } from "@/components/MercadoPagoCheckout";
import { BENEFICIOS_PRO, PLANOS_ASSINATURA } from "@/data/training";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer } from "@/lib/player-store";
import { trackMeta, trackMetaCustom } from "@/lib/meta-pixel";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { RouteError, RouteNotFound } from "@/components/RouteBoundary";

const PLANOS_IDS = new Set(PLANOS_ASSINATURA.map((p) => p.id));

export type HomeSearch = {
  from?: string;
  checkout?: string;
  plano?: string;
  teaser?: string;
  ref?: string;
};

export const Route = createFileRoute("/")({
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
  validateSearch: (search: Record<string, unknown>): HomeSearch => {
    const out: HomeSearch = {};
    if (typeof search["from"] === "string") out.from = search["from"];
    if (typeof search["checkout"] === "string") out.checkout = search["checkout"];
    if (typeof search["teaser"] === "string") out.teaser = search["teaser"];
    if (typeof search["ref"] === "string") out.ref = search["ref"];
    if (typeof search["plano"] === "string" && PLANOS_IDS.has(search["plano"])) {
      out.plano = search["plano"];
    }
    return out;
  },
  head: () => ({
    meta: [
      { title: "Jogador PRO System — Treine como atleta PRO" },
      {
        name: "description",
        content:
          "Plano guiado de 4 semanas para evoluir no futebol. Técnica, controle, explosão e performance. Assine por R$47/mês e comece hoje.",
      },
      { property: "og:title", content: "Jogador PRO System — Treine como atleta PRO" },
      {
        property: "og:description",
        content: "Assine e destrave o plano guiado completo de treinos de futebol.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const CODE_RE = /^[A-Za-z0-9_-]{1,40}$/;
function codigoValido(value: string) {
  return CODE_RE.test(value);
}

function HomePage() {
  const { refreshEntitlement, logado, state, email } = usePlayer();
  const navigate = useNavigate();
  const { from, plano, checkout, teaser, ref } = Route.useSearch();
  const [escolhido, setEscolhido] = useState(plano ?? "semestral");
  const [mostrarBrick, setMostrarBrick] = useState(false);
  const [pendingPix, setPendingPix] = useState(false);
  const [cupomInput, setCupomInput] = useState("");
  const [cupomAplicado, setCupomAplicado] = useState<{ code: string; discount: number } | null>(null);
  const [validandoCupom, setValidandoCupom] = useState(false);

  useEffect(() => {
    if (plano) setEscolhido(plano);
  }, [plano]);

  useEffect(() => {
    if (ref && codigoValido(ref)) {
      try {
        sessionStorage.setItem("jogador-pro-affiliate-ref", ref);
      } catch {
        /* ignore */
      }
      void supabase.from("affiliate_clicks").insert({ code: ref });
      void (async () => {
        const porCodigo = await supabase
          .from("coupons")
          .select("code, discount_percent")
          .eq("active", true)
          .eq("code", ref.toUpperCase())
          .maybeSingle();
        let achado = porCodigo.data;
        if (!achado) {
          const porAfiliado = await supabase
            .from("coupons")
            .select("code, discount_percent")
            .eq("active", true)
            .eq("affiliate_code", ref)
            .limit(1)
            .maybeSingle();
          achado = porAfiliado.data;
        }
        if (achado) {
          setCupomInput(achado.code);
          setCupomAplicado({ code: achado.code, discount: achado.discount_percent });
        }
      })();
    }
  }, [ref]);

  const aplicarCupom = async () => {
    const code = cupomInput.trim().toUpperCase();
    if (!code) {
      toast.message("Digite um cupom");
      return;
    }
    if (!codigoValido(code)) {
      toast.error("Cupom inválido");
      setCupomAplicado(null);
      return;
    }
    setValidandoCupom(true);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("code, discount_percent, active, max_redemptions, redemptions, affiliate_code")
        .eq("code", code)
        .maybeSingle();
      if (error || !data || !data.active) {
        toast.error("Cupom inválido");
        setCupomAplicado(null);
        return;
      }
      if (data.max_redemptions != null && data.redemptions >= data.max_redemptions) {
        toast.error("Cupom esgotado");
        setCupomAplicado(null);
        return;
      }
      if (data.affiliate_code) {
        try {
          sessionStorage.setItem("jogador-pro-affiliate-ref", data.affiliate_code);
        } catch {
          /* ignore */
        }
      }
      setCupomAplicado({ code: data.code, discount: data.discount_percent });
      setMostrarBrick(false);
      toast.success(`Cupom ${data.code} · −${data.discount_percent}%`);
    } finally {
      setValidandoCupom(false);
    }
  };

  useEffect(() => {
    trackMeta("ViewContent", {
      content_name: "home",
      content_category: "landing",
    });
    trackMetaCustom("PaywallHit", { from: from ?? "direct" });
  }, [from]);

  const abrirBrick = () => {
    trackMeta("InitiateCheckout", {
      content_name: escolhido,
      currency: "BRL",
      value: (PLANOS_ASSINATURA.find((p) => p.id === escolhido)?.precoCentavos ?? 0) / 100,
      num_items: 1,
    });
    setMostrarBrick(true);
  };

  useEffect(() => {
    if (checkout === "1" && logado && !state.assinante) {
      trackMeta("InitiateCheckout", {
        content_name: escolhido,
        currency: "BRL",
        value: (PLANOS_ASSINATURA.find((p) => p.id === escolhido)?.precoCentavos ?? 0) / 100,
        num_items: 1,
      });
      setMostrarBrick(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só ao retomar pós-auth
  }, [checkout, logado, state.assinante]);

  const abrirCheckout = () => {
    if (!logado) {
      void navigate({ to: "/auth", search: { from: "planos", plano: escolhido } });
      return;
    }
    abrirBrick();
  };

  return (
    <AppShell
      title="Jogador PRO System"
      subtitle="Treine como atleta. Todo dia."
      hideNav
      action={
        logado ? (
          <Link
            to="/app"
            className="text-xs font-semibold text-primary underline underline-offset-4"
          >
            Ir para o app
          </Link>
        ) : (
          <Link
            to="/auth"
            search={{ from: "home" }}
            className="text-xs font-semibold text-primary underline underline-offset-4"
          >
            Entrar
          </Link>
        )
      }
    >
      {teaser ? (
        <div className="mb-5 rounded-[1.5rem] border border-primary/30 bg-primary/10 p-4 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-wide text-primary">Assinatura necessária</p>
          <p className="mt-1 text-sm font-extrabold text-foreground">{teaser}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Com PRO você destrava o plano completo, biblioteca e comunidade.
          </p>
        </div>
      ) : null}

      <div className="mb-6 rounded-[1.75rem] border border-border/60 bg-card p-6 shadow-soft sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Metodologia 4 pilares</p>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          4 semanas para você jogar em outro nível
        </h2>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
          Semana 1: Base · Semana 2: Controle · Semana 3: Explosão · Semana 4: Performance. Treinos guiados com
          timer, vídeos e progressão de XP.
        </p>
        <ul className="mt-5 space-y-2">
          {BENEFICIOS_PRO.map((b) => (
            <li key={b} className="flex items-center gap-2 text-sm text-foreground">
              <Check className="h-4 w-4 text-primary" /> {b}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {PLANOS_ASSINATURA.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setEscolhido(p.id);
              setMostrarBrick(false);
              setPendingPix(false);
            }}
            className={cn(
              "rounded-[1.5rem] border p-5 text-left shadow-soft transition-colors md:min-h-[140px]",
              escolhido === p.id ? "border-primary bg-primary/10" : "border-border/60 bg-card",
            )}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-base font-extrabold text-foreground">{p.nome}</span>
              <span className="text-xl font-black text-foreground">
                {p.preco}
                <span className="text-xs font-medium text-muted-foreground">{p.periodo}</span>
              </span>
            </div>
            <p className={cn("mt-1 text-xs", p.destaque ? "font-bold text-primary" : "text-muted-foreground")}>
              {p.nota}
            </p>
          </button>
        ))}
      </div>

      <div className="mx-auto mt-6 w-full max-w-xl">
        {!state.assinante ? (
          <div className="mb-4 flex gap-2">
            <Input
              value={cupomInput}
              onChange={(e) => setCupomInput(e.target.value.toUpperCase())}
              placeholder="Cupom (ex. PRO10)"
              className="h-11"
            />
            <Button
              type="button"
              variant="outline"
              className="h-11 shrink-0"
              disabled={validandoCupom}
              onClick={() => void aplicarCupom()}
            >
              Aplicar
            </Button>
          </div>
        ) : null}
        {cupomAplicado ? (
          <p className="mb-3 text-center text-xs font-semibold text-primary">
            {cupomAplicado.code} ativo · {cupomAplicado.discount}% off
          </p>
        ) : null}

        {state.assinante ? (
          <Button asChild size="lg" className="h-14 w-full text-base font-extrabold">
            <Link to="/app">Você já é PRO — ir para o app</Link>
          </Button>
        ) : pendingPix ? (
          <div className="rounded-[1.5rem] border border-primary/30 bg-card p-5 text-center shadow-soft">
            <Clock className="mx-auto h-8 w-8 text-primary" />
            <p className="mt-3 text-base font-extrabold text-foreground">Aguardando confirmação do Pix</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Assim que o Mercado Pago confirmar, seu acesso PRO libera automaticamente. Pode fechar e voltar em
              alguns minutos.
            </p>
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => {
                void refreshEntitlement().then(() => toast.message("Status atualizado"));
              }}
            >
              Já paguei — atualizar status
            </Button>
          </div>
        ) : !mostrarBrick ? (
          <Button size="lg" className="h-14 w-full text-base font-extrabold" onClick={abrirCheckout}>
            Pagar com Mercado Pago
          </Button>
        ) : (
          <MercadoPagoCheckout
            planoId={escolhido}
            email={email}
            couponCode={cupomAplicado?.code ?? null}
            discountPercent={cupomAplicado?.discount ?? 0}
            onApproved={() => {
              void refreshEntitlement().then(() => {
                toast.success("Acesso PRO liberado");
                void navigate({ to: "/bem-vindo-pro", replace: true });
              });
            }}
            onPending={() => {
              setPendingPix(true);
              setMostrarBrick(false);
              void refreshEntitlement();
            }}
          />
        )}
      </div>

      <div className="mt-6 flex flex-col items-center gap-2 text-center text-xs text-muted-foreground">
        <p className="inline-flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5" />
          Pagamento seguro via Mercado Pago
        </p>
        <p>
          {logado
            ? "Checkout transparente (cartão, boleto e Pix). Acesso liberado após aprovação."
            : "Você precisará entrar na conta antes do checkout — e voltamos direto ao pagamento."}
        </p>
        <p className="text-[11px]">Dúvidas? Fale com a gente no Instagram @jogadorprosystem</p>
      </div>
    </AppShell>
  );
}
