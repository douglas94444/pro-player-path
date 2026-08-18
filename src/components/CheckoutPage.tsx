import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Check, CreditCard, Lock, QrCode, ShieldCheck } from "lucide-react";
import { CheckoutOferta, dispararCheckout } from "@/components/CheckoutOferta";
import { FaqSection } from "@/components/landing/FaqSection";
import { GarantiaBadge } from "@/components/landing/GarantiaBadge";
import { UrgencyBar } from "@/components/landing/UrgencyBar";
import { CAMPANHA } from "@/data/campanha-copy";
import { PLANOS_ASSINATURA } from "@/data/training";
import { usePlayer } from "@/lib/player-store";
import { captureUtmFromSearch, type UtmParams } from "@/lib/utm";
import { trackMetaCustom, trackMetaDedup } from "@/lib/meta-pixel";
import { cn } from "@/lib/utils";

export type CheckoutSearch = {
  from?: string;
  checkout?: string;
  plano?: string;
  teaser?: string;
  ref?: string;
} & UtmParams;

function precoComDesconto(centavos: number, percent: number) {
  const valor = Math.max(1, Math.round((centavos / 100) * (1 - percent / 100) * 100) / 100);
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function CheckoutPage({ search }: { search: CheckoutSearch }) {
  const { logado, state, authReady } = usePlayer();
  const planoInicial =
    search.plano && PLANOS_ASSINATURA.some((p) => p.id === search.plano) ? search.plano : "semestral";
  const [plano, setPlano] = useState(planoInicial);
  const [desconto, setDesconto] = useState(0);

  useEffect(() => {
    if (search.plano && PLANOS_ASSINATURA.some((p) => p.id === search.plano)) {
      setPlano(search.plano);
    }
  }, [search.plano]);

  useEffect(() => {
    captureUtmFromSearch(search);
    trackMetaDedup("ViewContent", {
      content_name: "checkout_mercadopago",
      content_category: search.utm_campaign ?? search.from ?? "direct",
    });
    trackMetaCustom("CheckoutPageView", {
      plano: planoInicial,
      from: search.from ?? "",
    });
  }, [search, planoInicial]);

  const onPlanoChange = useCallback((id: string) => {
    setPlano(id);
  }, []);

  const escolher = (id: string) => {
    setPlano(id);
    dispararCheckout(id, false);
  };

  const config = PLANOS_ASSINATURA.find((p) => p.id === plano) ?? PLANOS_ASSINATURA[1]!;
  const copy = CAMPANHA.planos.itens.find((p) => p.id === plano);
  const abrirAuto =
    search.checkout === "1" || Boolean(search.from && search.from !== "auth" && search.from !== "landing");

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background pb-16 text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_50%_at_80%_-10%,_oklch(0.78_0.2_141_/_0.16),_transparent_55%)]" />

      <UrgencyBar />

      <header className="relative border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <p className="truncate text-sm font-black uppercase tracking-[0.16em] text-primary">{CAMPANHA.brand}</p>
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
            <Lock className="h-3.5 w-3.5 text-primary" />
            Checkout seguro
          </p>
        </div>
      </header>

      <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:grid-rows-[auto_1fr] lg:items-start lg:py-12">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Passo final</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Liberar acesso PRO</h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Pagamento no Mercado Pago. Pix ou cartão. Acesso libera na hora da aprovação.
          </p>

          <ol className="mt-6 flex flex-wrap gap-2">
            {[
              { n: "1", label: "Conta", done: logado },
              { n: "2", label: "Plano", done: true },
              { n: "3", label: "Pagamento", done: Boolean(state.assinante) },
            ].map((s) => (
              <li
                key={s.n}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold",
                  s.done
                    ? "border-primary/40 bg-primary/10 text-foreground"
                    : "border-border/60 text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
                    s.done ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  {s.done ? <Check className="h-3 w-3" /> : s.n}
                </span>
                {s.label}
              </li>
            ))}
          </ol>

          <fieldset className="mt-8">
            <legend className="text-sm font-extrabold text-foreground">Escolha o plano</legend>
            <p className="mt-1 text-xs text-muted-foreground">Mesmo acesso completo nos três. Sem fidelidade.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {CAMPANHA.planos.itens.map((item) => {
                const ativo = plano === item.id;
                const destaque = item.id === "semestral";
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => escolher(item.id)}
                    className={cn(
                      "relative flex flex-col rounded-2xl border p-4 text-left shadow-soft transition-colors",
                      ativo
                        ? "border-primary bg-primary/5 ring-2 ring-primary"
                        : "border-border/60 bg-card/70 hover:border-primary/50",
                    )}
                  >
                    {item.badge ? (
                      <span
                        className={cn(
                          "mb-2 w-fit rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest",
                          destaque ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
                        )}
                      >
                        {item.badge}
                      </span>
                    ) : (
                      <span className="mb-2 h-5" />
                    )}
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{item.nome}</span>
                    {item.de ? (
                      <span className="mt-1 text-[11px] text-muted-foreground line-through">{item.de}</span>
                    ) : (
                      <span className="mt-1 text-[11px] text-muted-foreground">Sem fidelidade</span>
                    )}
                    <span className="mt-0.5 text-2xl font-black tracking-tight">{item.preco}</span>
                    <span className="text-xs font-semibold text-primary">{item.equivalente}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        <aside className="lg:sticky lg:top-6 lg:row-span-2">
          <div className="rounded-[1.75rem] border border-border/60 bg-card p-5 shadow-soft-lg sm:p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Resumo</p>
            <div className="mt-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-black text-foreground">PRO {config.nome}</p>
                <p className="text-xs text-muted-foreground">{copy?.periodo ?? config.periodo}</p>
              </div>
              <p className="text-right text-xl font-black tabular-nums">
                {desconto > 0 ? precoComDesconto(config.precoCentavos, desconto) : config.preco}
              </p>
            </div>
            <p className="mt-1 text-xs font-semibold text-primary">
              Equivale a {copy?.equivalente ?? config.nota}
            </p>
            {desconto > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                De {config.preco} · cupom −{desconto}%
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                <QrCode className="h-3.5 w-3.5 text-primary" /> Pix
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                <CreditCard className="h-3.5 w-3.5 text-primary" /> Cartão
              </span>
            </div>

            <div className="mt-5 border-t border-border/60 pt-4">
              <CheckoutOferta
                variant="page"
                planoInicial={plano}
                refCode={search.ref}
                abrirAoMontar={abrirAuto}
                onPlanoChange={onPlanoChange}
                onCupomChange={(percent) => setDesconto(percent)}
              />
            </div>

            <ul className="mt-5 space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
                Pagamento processado pelo Mercado Pago
              </li>
              <li className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 shrink-0 text-primary" />
                Dados do cartão não passam pelo nosso servidor
              </li>
              <li>
                {logado
                  ? "Acesso PRO na aprovação. Pix pode levar alguns minutos."
                  : authReady
                    ? "Crie a conta na próxima tela e voltamos direto ao Mercado Pago."
                    : "Confirmando sua sessão…"}
              </li>
            </ul>
          </div>
        </aside>

        <div>
          <p className="text-sm font-extrabold">Você recebe agora</p>
          <ul className="mt-3 space-y-2">
            {CAMPANHA.oferta.recebe.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
            {copy?.inclui
              .filter((item) => !CAMPANHA.oferta.recebe.includes(item))
              .map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
          </ul>

          <div className="mt-8 max-w-xl">
            <GarantiaBadge />
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {CAMPANHA.depoimentos.itens.slice(0, 2).map((d) => (
              <figure key={d.texto} className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-soft">
                <blockquote className="text-sm leading-relaxed text-foreground">{d.texto}</blockquote>
                <figcaption className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {d.nome}
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{CAMPANHA.depoimentos.selo}</p>

          <div className="mt-10">
            <h2 className="text-lg font-extrabold">Dúvidas antes de pagar</h2>
            <FaqSection />
          </div>
        </div>
      </div>
    </main>
  );
}
