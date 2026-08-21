import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CreditCard, Lock, ShieldCheck, User } from "lucide-react";
import { CheckoutOferta } from "@/components/CheckoutOferta";
import { pedirLoginCheckout } from "@/components/CheckoutAuth";
import { CheckoutVoltar } from "@/components/CheckoutVoltar";
import { SelosConfianca } from "@/components/landing/SelosConfianca";
import { CAMPANHA } from "@/data/campanha-copy";
import { PLANOS_ASSINATURA } from "@/data/training";
import { PLANO_PADRAO, type CheckoutSearch } from "@/lib/checkout";
import { whatsappSupportHref } from "@/lib/product-config";
import { usePlayer } from "@/lib/player-store";
import { captureUtmFromSearch } from "@/lib/utm";
import { trackMetaCustom, trackMetaDedup } from "@/lib/meta-pixel";
import { cn } from "@/lib/utils";

function precoComDesconto(centavos: number, percent: number) {
  const valor = Math.max(1, Math.round((centavos / 100) * (1 - percent / 100) * 100) / 100);
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function CardSecao({
  icone: Icone,
  titulo,
  children,
}: {
  icone: typeof User;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft sm:p-6">
      <div className="mb-5 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icone className="h-4 w-4" />
        </span>
        <h2 className="text-base font-extrabold text-foreground">{titulo}</h2>
      </div>
      {children}
    </section>
  );
}

export function CheckoutPagamento({ search }: { search: CheckoutSearch }) {
  const { logado } = usePlayer();
  const navigate = useNavigate();
  const plano =
    search.plano && PLANOS_ASSINATURA.some((p) => p.id === search.plano) ? search.plano : PLANO_PADRAO;
  const [desconto, setDesconto] = useState(0);
  const onCupomChange = useCallback((percent: number) => setDesconto(percent), []);
  const zap = whatsappSupportHref("Oi! Quero tirar uma dúvida antes de assinar o Jogador PRO.");

  useEffect(() => {
    captureUtmFromSearch(search);
    trackMetaDedup("ViewContent", {
      content_name: "checkout_mercadopago",
      content_category: search.utm_campaign ?? search.from ?? "direct",
    });
    trackMetaCustom("CheckoutPageView", {
      plano,
      from: search.from ?? "",
    });
  }, [search, plano]);

  const config = PLANOS_ASSINATURA.find((p) => p.id === plano) ?? PLANOS_ASSINATURA[1]!;
  const copy = CAMPANHA.planos.itens.find((p) => p.id === plano);
  const abrirAuto = search.checkout === "1" || Boolean(search.from && search.from !== "auth" && search.from !== "landing");
  const total = desconto > 0 ? precoComDesconto(config.precoCentavos, desconto) : config.preco;

  const escolherPlano = (id: string) => {
    void navigate({
      to: "/checkout",
      search: { ...search, plano: id },
      replace: true,
    });
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-muted/30 pb-28 text-foreground lg:pb-16">
      <header className="relative border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <CheckoutVoltar from={search.from} />
          <p className="truncate text-sm font-black uppercase tracking-[0.16em] text-primary">{CAMPANHA.brand}</p>
          {logado ? (
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
              <Lock className="h-3.5 w-3.5 text-primary" />
              Checkout seguro
            </p>
          ) : (
            <button
              type="button"
              onClick={() => pedirLoginCheckout()}
              className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
            >
              Já possui conta? Faça login aqui
            </button>
          )}
        </div>
      </header>

      <div className="relative mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Liberar o plano de 12 meses</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          {copy ? `${copy.nome} · ${copy.preco} · ${copy.equivalente}` : "Pix ou cartão. Acesso na aprovação."}
        </p>
        {search.teaser ? (
          <p className="mt-3 max-w-xl rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm font-semibold text-foreground">
            {search.teaser}
          </p>
        ) : null}

        <CheckoutOferta
          planoInicial={plano}
          refCode={search.ref}
          abrirAoMontar={abrirAuto}
          onCupomChange={onCupomChange}
          onPlanoChange={(id) => {
            if (id !== plano) escolherPlano(id);
          }}
        >
          {({ dados, pagamento, cta, cupomCode }) => (
            <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
              <div className="space-y-4">
                <CardSecao icone={CreditCard} titulo="Seu plano">
                  <div className="grid gap-2 sm:grid-cols-3">
                    {PLANOS_ASSINATURA.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => escolherPlano(p.id)}
                        className={cn(
                          "rounded-2xl border px-3 py-3 text-left",
                          p.id === plano
                            ? "border-primary bg-primary/10"
                            : "border-border/60 bg-background hover:border-primary/50",
                        )}
                      >
                        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{p.nome}</p>
                        <p className="mt-1 text-base font-black text-foreground">{p.preco}</p>
                      </button>
                    ))}
                  </div>
                </CardSecao>
                <CardSecao icone={User} titulo="Informações pessoais">
                  {dados}
                </CardSecao>
                <CardSecao icone={CreditCard} titulo="Pix ou cartão">
                  <div id="pagamento" className="scroll-mt-24">
                    {pagamento}
                  </div>
                </CardSecao>
              </div>

              <aside className="lg:sticky lg:top-20">
                <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft-lg sm:p-6">
                  <h2 className="text-base font-extrabold text-foreground">Confirmação do pedido</h2>

                  <div className="mt-5 border-b border-border/60 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-foreground">PRO {config.nome}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{copy?.periodo ?? config.periodo}</p>
                      </div>
                      <p className="text-sm font-black tabular-nums text-primary">{config.preco}</p>
                    </div>
                  </div>

                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Subtotal</dt>
                      <dd className="font-semibold tabular-nums">{config.preco}</dd>
                    </div>
                    {desconto > 0 ? (
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Cupom{cupomCode ? ` ${cupomCode}` : ""}</dt>
                        <dd className="font-semibold tabular-nums text-primary">−{desconto}%</dd>
                      </div>
                    ) : null}
                    <div className="flex justify-between gap-3 border-t border-border/60 pt-3">
                      <dt className="font-extrabold">Valor total</dt>
                      <dd className="text-lg font-black tabular-nums text-primary">{total}</dd>
                    </div>
                  </dl>
                  <p className="mt-1 text-xs font-semibold text-primary">
                    Equivale a {copy?.equivalente ?? config.nota}
                  </p>
                  {copy?.parcelas ? <p className="text-xs text-muted-foreground">{copy.parcelas}</p> : null}

                  <div className="mt-5 hidden lg:block">{cta}</div>
                  <p className="mt-3 text-center text-[11px] text-muted-foreground">{CAMPANHA.garantia.curta}</p>
                  <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    Pagamento seguro · Pix ou cartão
                  </p>
                  {zap ? (
                    <a
                      href={zap}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 block text-center text-xs font-semibold text-primary underline underline-offset-4"
                    >
                      Dúvida no Pix? Fale no WhatsApp
                    </a>
                  ) : null}
                  <div className="mt-4">
                    <SelosConfianca />
                  </div>
                </section>
              </aside>

              <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-card/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-soft-lg backdrop-blur lg:hidden">
                <div className="mx-auto flex max-w-lg items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-foreground">PRO {config.nome}</p>
                    <p className="text-sm font-black tabular-nums text-primary">{total}</p>
                  </div>
                  <div className="min-w-[11rem] flex-1">{cta}</div>
                </div>
              </div>
            </div>
          )}
        </CheckoutOferta>
      </div>
    </main>
  );
}
