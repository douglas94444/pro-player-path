import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  CalendarDays,
  Check,
  Clock,
  MonitorSmartphone,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CAMPANHA, type ProofSlot } from "@/data/campanha-copy";
import { PLANOS_ASSINATURA } from "@/data/training";
import { captureUtmFromSearch } from "@/lib/utm";
import { trackMetaCustom, trackMetaDedup } from "@/lib/meta-pixel";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/lib/player-store";
import { CheckoutOferta, dispararCheckout, rolarParaOferta, CHECKOUT_EVENT } from "@/components/CheckoutOferta";
import { TopBar } from "@/components/landing/TopBar";
import { GarantiaBadge } from "@/components/landing/GarantiaBadge";
import { FaqSection } from "@/components/landing/FaqSection";
import { AppShowcase, ModoRapidoCard } from "@/components/landing/AppShowcase";
import { DepoimentosSection } from "@/components/landing/DepoimentosSection";
import { UrgencyBar } from "@/components/landing/UrgencyBar";
import { BeneficiosGrid } from "@/components/landing/BeneficiosGrid";
import { PreviewTreinos } from "@/components/landing/PreviewTreinos";
import { InclusoStack } from "@/components/landing/InclusoStack";
import { PlanosTable } from "@/components/landing/PlanosTable";
import { AvaliacoesWidget } from "@/components/landing/AvaliacoesWidget";
import { SelosConfianca } from "@/components/landing/SelosConfianca";


export type LandingSearch = {
  from?: string;
  checkout?: string;
  plano?: string;
  teaser?: string;
  ref?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

export function validateLandingSearch(search: Record<string, unknown>): LandingSearch {
  const out: LandingSearch = {};
  if (typeof search["from"] === "string") out.from = search["from"];
  if (typeof search["checkout"] === "string") out.checkout = search["checkout"];
  if (typeof search["teaser"] === "string") out.teaser = search["teaser"];
  if (typeof search["ref"] === "string") out.ref = search["ref"];
  if (typeof search["utm_source"] === "string") out.utm_source = search["utm_source"];
  if (typeof search["utm_medium"] === "string") out.utm_medium = search["utm_medium"];
  if (typeof search["utm_campaign"] === "string") out.utm_campaign = search["utm_campaign"];
  if (typeof search["utm_content"] === "string") out.utm_content = search["utm_content"];
  if (typeof search["utm_term"] === "string") out.utm_term = search["utm_term"];
  if (typeof search["plano"] === "string") {
    const ids = new Set(PLANOS_ASSINATURA.map((p) => p.id));
    if (ids.has(search["plano"])) out.plano = search["plano"];
  }
  return out;
}

function ProofMedia({ slot }: { slot: ProofSlot }) {
  if (slot.type === "video") {
    return <video src={slot.src} controls playsInline preload="none" className="h-full w-full object-cover" title={slot.title} />;
  }
  if (slot.type === "image") {
    return <img src={slot.src} alt={slot.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />;
  }
  return <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{slot.title}</p>;
}

export function LandingPage({ search }: { search: LandingSearch }) {
  const { logado, state } = usePlayer();
  const [planoAtivo, setPlanoAtivo] = useState<string | undefined>(search.plano ?? CAMPANHA.heroCtaPlano);

  useEffect(() => {
    captureUtmFromSearch(search);
    trackMeta("ViewContent", {
      content_name: "landing_campanha",
      content_category: search.utm_campaign ?? "organic",
    });
    trackMetaCustom("LandingView", {
      utm_source: search.utm_source ?? "",
      utm_campaign: search.utm_campaign ?? "",
    });
  }, [search]);

  // Scroll depth: mede onde a página perde o visitante.
  useEffect(() => {
    const marcos = new Set<number>();
    const onScroll = () => {
      const alturaTotal = document.documentElement.scrollHeight - window.innerHeight;
      if (alturaTotal <= 0) return;
      const pct = (window.scrollY / alturaTotal) * 100;
      for (const marco of [50, 90]) {
        if (pct >= marco && !marcos.has(marco)) {
          marcos.add(marco);
          trackMetaCustom("ScrollDepth", { depth: String(marco) });
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Sincroniza card ativo com o plano escolhido no checkout.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ plano?: string; iniciar?: boolean }>).detail;
      if (detail?.plano) setPlanoAtivo(detail.plano);
    };
    window.addEventListener(CHECKOUT_EVENT, handler);
    return () => window.removeEventListener(CHECKOUT_EVENT, handler);
  }, []);

  // CTAs rolam até a oferta; quem já está logado (e ainda não é PRO) vai direto para o checkout.
  const irParaOferta = useCallback(
    (plano?: string) => {
      rolarParaOferta();
      if (plano) setPlanoAtivo(plano);
      if (logado && !state.assinante) {
        window.setTimeout(() => dispararCheckout(plano, true), 350);
      } else if (plano) {
        dispararCheckout(plano, true);
      }
    },
    [logado, state.assinante],
  );



  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background pb-24 text-foreground md:pb-0">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_70%_at_50%_-10%,_oklch(0.78_0.2_141_/_0.18),_transparent_55%)]" />

      <TopBar logado={logado} onAssinar={() => irParaOferta(CAMPANHA.heroCtaPlano)} />

      {/* Urgência + social proof strip */}
      <div className="relative mt-14">
        <UrgencyBar />
        <div className="border-b border-border/60 bg-card/80 shadow-soft backdrop-blur">
          <p className="animate-in fade-in slide-in-from-top-2 mx-auto max-w-6xl px-5 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-primary duration-700 sm:text-xs">
            {CAMPANHA.socialProof}
          </p>
        </div>
      </div>

      {/* Hero */}
      <section className="relative mx-auto flex w-full max-w-6xl flex-col justify-center px-5 pb-12 pt-12 sm:px-8 md:pb-16 md:pt-16">
        <div className="animate-in fade-in slide-in-from-bottom-4 max-w-3xl duration-700">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-primary sm:text-base">
            {CAMPANHA.brand}
          </p>
          <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            {CAMPANHA.headline}
            <span className="mt-2 block text-foreground/90">{CAMPANHA.headlineLead}</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">{CAMPANHA.subheadline}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              size="lg"
              className="h-14 w-full px-8 text-base font-extrabold sm:w-auto sm:min-w-[240px]"
              onClick={() => irParaOferta(CAMPANHA.heroCtaPlano)}
            >
              {CAMPANHA.heroCta}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 w-full px-8 text-base font-extrabold sm:w-auto sm:min-w-[240px]"
              onClick={() => irParaOferta("semestral")}
            >
              {CAMPANHA.heroCtaSecundario}
            </Button>
          </div>

          <p className="mt-4 text-sm font-bold text-foreground">{CAMPANHA.precoAncora}</p>
          <p className="mt-1 text-xs text-muted-foreground">{CAMPANHA.precoComparativo}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <GarantiaBadge compact />
            <p className="text-xs text-muted-foreground">{CAMPANHA.heroCtaHint}</p>
          </div>
          <div className="mt-4">
            <SelosConfianca />
          </div>

        </div>
      </section>

      {/* Benefícios em ícones */}
      <Section tone="card">
        <Eyebrow>{CAMPANHA.beneficiosIcones.eyebrow}</Eyebrow>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
          {CAMPANHA.beneficiosIcones.title}
        </h2>
        <BeneficiosGrid />
        <div className="mt-8">
          <Button
            size="lg"
            className="h-14 w-full text-base font-extrabold sm:w-auto sm:min-w-[260px]"
            onClick={() => irParaOferta(CAMPANHA.heroCtaPlano)}
          >
            {CAMPANHA.heroCta}
          </Button>
        </div>
      </Section>


      {/* Problema */}
      <Section>
        <Eyebrow>O problema</Eyebrow>
        <h2 className="mt-3 max-w-2xl text-2xl font-extrabold tracking-tight sm:text-3xl">
          Se você joga bola, mas sente que não evolui… provavelmente não é falta de esforço.
        </h2>
        <ul className="mt-8 space-y-3">
          {CAMPANHA.problemas.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-foreground sm:text-base">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                <X className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-10 border-l-2 border-primary pl-5">
          <p className="text-xl font-black text-foreground sm:text-2xl">{CAMPANHA.quebra.title}</p>
          <p className="mt-1 text-lg font-semibold text-primary sm:text-xl">{CAMPANHA.quebra.body}</p>
        </div>
      </Section>

      {/* Solução */}
      <Section tone="card">
        <Eyebrow>{CAMPANHA.solucao.eyebrow}</Eyebrow>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-primary sm:text-4xl">
          {CAMPANHA.solucao.title}
        </h2>
        <p className="mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">{CAMPANHA.solucao.body}</p>
        <ol className="mt-8 grid gap-4 sm:grid-cols-3">
          {CAMPANHA.solucao.passos.map((passo, i) => (
            <li key={passo} className="border-t border-primary/30 pt-4">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Passo {i + 1}</p>
              <p className="mt-2 text-base font-semibold text-foreground">{passo}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Como funciona */}
      <Section>
        <Eyebrow>Como funciona</Eyebrow>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">Simples. Direto. Todo dia.</h2>

        <div className="mt-10 grid gap-10 lg:grid-cols-3">
          <div>
            <CalendarDays className="h-6 w-6 text-primary" />
            <h3 className="mt-3 text-lg font-bold">{CAMPANHA.comoFunciona.plano.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{CAMPANHA.comoFunciona.plano.body}</p>
            <ul className="mt-4 space-y-2">
              {CAMPANHA.comoFunciona.plano.semanas.map((s) => (
                <li key={s.semana} className="flex items-baseline gap-2 text-sm">
                  <span className="font-bold text-primary">Semana {s.semana}</span>
                  <span className="text-muted-foreground">{s.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <Clock className="h-6 w-6 text-primary" />
            <h3 className="mt-3 text-lg font-bold">{CAMPANHA.comoFunciona.tempo.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{CAMPANHA.comoFunciona.tempo.body}</p>
            <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">Perfeito pra quem</p>
            <ul className="mt-2 space-y-1.5 text-sm text-foreground">
              {CAMPANHA.comoFunciona.tempo.para.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" /> {p}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <MonitorSmartphone className="h-6 w-6 text-primary" />
            <h3 className="mt-3 text-lg font-bold">{CAMPANHA.comoFunciona.acesso.title}</h3>
            <ul className="mt-4 space-y-1.5 text-sm text-foreground">
              {CAMPANHA.comoFunciona.acesso.items.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" /> {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* Veja por dentro */}
      <Section tone="card">
        <Eyebrow>{CAMPANHA.showcase.eyebrow}</Eyebrow>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{CAMPANHA.showcase.title}</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">{CAMPANHA.showcase.body}</p>
        <AppShowcase />
      </Section>

      {/* Preview de treinos reais */}
      <Section>
        <Eyebrow>{CAMPANHA.preview.eyebrow}</Eyebrow>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{CAMPANHA.preview.title}</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">{CAMPANHA.preview.body}</p>
        <PreviewTreinos onCta={() => irParaOferta(CAMPANHA.heroCtaPlano)} />
      </Section>

      {/* Modo Rápido */}
      <Section tone="card">
        <ModoRapidoCard onCta={() => irParaOferta(CAMPANHA.heroCtaPlano)} />
      </Section>



      {/* Benefícios */}
      <Section tone="card">
        <Eyebrow>Transformação</Eyebrow>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Com o Jogador PRO, você vai:
        </h2>
        <ul className="mt-8 space-y-3">
          {CAMPANHA.beneficios.map((b) => (
            <li key={b} className="flex items-start gap-3 text-sm sm:text-base">
              <Zap className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span className="font-medium text-foreground">{b}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Diferencial */}
      <Section>
        <h2 className="max-w-2xl text-2xl font-extrabold tracking-tight sm:text-3xl">
          {CAMPANHA.diferencial.title}
        </h2>
        <p className="mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">{CAMPANHA.diferencial.body}</p>
        <ul className="mt-6 space-y-2">
          {CAMPANHA.diferencial.pontos.map((p) => (
            <li key={p} className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="text-primary">→</span> {p}
            </li>
          ))}
        </ul>
      </Section>

      {/* Prova */}
      <Section tone="card">
        <Eyebrow>Prova</Eyebrow>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{CAMPANHA.prova.title}</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">{CAMPANHA.prova.body}</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {CAMPANHA.prova.slots.map((slot) => (
            <div
              key={slot.title}
              className="flex aspect-video items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-background/40 px-4 text-center"
            >
              <ProofMedia slot={slot} />
            </div>
          ))}
        </div>
      </Section>

      {/* Depoimentos */}
      <Section>
        <Eyebrow>{CAMPANHA.depoimentos.eyebrow}</Eyebrow>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{CAMPANHA.depoimentos.title}</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">{CAMPANHA.depoimentos.body}</p>
        <AvaliacoesWidget />
        <DepoimentosSection onCta={() => irParaOferta(CAMPANHA.heroCtaPlano)} />
      </Section>

      {/* Tudo incluso */}
      <Section tone="card">
        <Eyebrow>{CAMPANHA.incluso.eyebrow}</Eyebrow>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{CAMPANHA.incluso.title}</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">{CAMPANHA.incluso.body}</p>
        <InclusoStack />
      </Section>

      {/* FAQ */}
      <Section>
        <Eyebrow>Dúvidas</Eyebrow>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">Antes de assinar</h2>
        <FaqSection />
      </Section>

      {/* Planos + Oferta */}
      <Section id="oferta" tone="card">
        <Eyebrow>{CAMPANHA.planos.eyebrow}</Eyebrow>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{CAMPANHA.oferta.title}</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">{CAMPANHA.planos.body}</p>

        <p className="mt-6 text-sm text-muted-foreground">Você recebe:</p>
        <ul className="mt-2 space-y-2">
          {CAMPANHA.oferta.recebe.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-foreground">
              <Check className="h-4 w-4 text-primary" /> {item}
            </li>
          ))}
        </ul>

        <PlanosTable planoAtivo={planoAtivo} onSelecionar={(plano) => setPlanoAtivo(plano)} />

        <div className="mt-8 max-w-2xl">
          <GarantiaBadge />
        </div>

        <CheckoutOferta
          planoInicial={search.plano ?? CAMPANHA.heroCtaPlano}
          refCode={search.ref}
          abrirAoMontar={search.checkout === "1"}
        />

        <div className="mt-6">
          <SelosConfianca />
        </div>
      </Section>

      {/* Urgência */}
      <Section>
        <h2 className="max-w-2xl text-2xl font-extrabold tracking-tight sm:text-3xl">{CAMPANHA.urgencia.title}</h2>
        <p className="mt-3 text-lg font-semibold text-primary sm:text-xl">{CAMPANHA.urgencia.body}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            size="lg"
            className="h-14 w-full text-base font-extrabold sm:w-auto sm:min-w-[240px]"
            onClick={() => irParaOferta(CAMPANHA.heroCtaPlano)}
          >
            {CAMPANHA.urgencia.cta}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-14 w-full text-base font-extrabold sm:w-auto sm:min-w-[200px]"
            onClick={() => irParaOferta("semestral")}
          >
            {CAMPANHA.heroCtaSecundario}
          </Button>
        </div>
        <div className="mt-4">
          <GarantiaBadge compact />
        </div>
      </Section>


      <footer className="relative border-t border-border px-5 py-8 text-center text-xs text-muted-foreground">
        {CAMPANHA.brand} — treinos guiados para evoluir no jogo
      </footer>

      {/* Sticky mobile CTA */}
      <div className="animate-in slide-in-from-bottom-4 fixed inset-x-0 bottom-0 z-50 p-3 duration-500 md:hidden">
        <div className="rounded-[1.5rem] border border-border/60 bg-card/95 p-3 shadow-soft-lg backdrop-blur">
          <Button
            size="lg"
            className="h-12 w-full text-sm font-extrabold"
            onClick={() => irParaOferta(CAMPANHA.heroCtaPlano)}
          >
            {CAMPANHA.heroCta} · R$47
          </Button>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">{CAMPANHA.garantia.curta}</p>
        </div>
      </div>


    </main>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{children}</p>;
}

function Section({
  children,
  tone = "default",
  id,
}: {
  children: ReactNode;
  tone?: "default" | "card";
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn("relative", tone === "card" && "border-y border-border/50 bg-card/70")}
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-16">{children}</div>
    </section>
  );
}
