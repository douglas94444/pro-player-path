import { useCallback, useEffect, useState, type ReactNode } from "react";
import { CreditCard, Lock, ShieldCheck, User } from "lucide-react";
import { CheckoutOferta } from "@/components/CheckoutOferta";
import { pedirLoginCheckout } from "@/components/CheckoutAuth";
import { CheckoutVoltar } from "@/components/CheckoutVoltar";
import { SelosConfianca } from "@/components/landing/SelosConfianca";
import { CAMPANHA } from "@/data/campanha-copy";
import { PLANOS_ASSINATURA } from "@/data/training";
import { PLANO_PADRAO, type CheckoutSearch } from "@/lib/checkout";
import { usePlayer } from "@/lib/player-store";
import { captureUtmFromSearch } from "@/lib/utm";
import { trackMetaCustom, trackMetaDedup } from "@/lib/meta-pixel";

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
  const plano =
    search.plano && PLANOS_ASSINATURA.some((p) => p.id === search.plano) ? search.plano : PLANO_PADRAO;
  const [desconto, setDesconto] = useState(0);
  const onCupomChange = useCallback((percent: number) => setDesconto(percent), []);

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

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-muted/30 pb-16 text-foreground">
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
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Finalizar compra</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Preencha os campos abaixo e clique em Finalizar pedido para concluir a compra.
        </p>

        <CheckoutOferta
          planoInicial={plano}
          refCode={search.ref}
          abrirAoMontar={abrirAuto}
          onCupomChange={onCupomChange}
        >
          {({ dados, pagamento, cupom, cta, cupomCode }) => (
            <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
              <div className="space-y-4">
                <CardSecao icone={User} titulo="Informações pessoais">
                  {dados}
                </CardSecao>
                <CardSecao icone={CreditCard} titulo="Método de pagamento">
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
                        <p className="mt-1 text-[11px] text-muted-foreground">Qtd 1</p>
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

                  <div className="mt-5">{cupom}</div>
                  <div className="mt-5">{cta}</div>
                  <p className="mt-3 text-center text-[11px] text-muted-foreground">{CAMPANHA.garantia.curta}</p>
                  <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    Pagamento seguro via Mercado Pago
                  </p>
                  <div className="mt-4">
                    <SelosConfianca />
                  </div>
                </section>
              </aside>
            </div>
          )}
        </CheckoutOferta>
      </div>
    </main>
  );
}
