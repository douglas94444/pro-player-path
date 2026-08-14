import { Link } from "@tanstack/react-router";
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
import { trackMeta, trackMetaCustom } from "@/lib/meta-pixel";
import { cn } from "@/lib/utils";

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

export function planosLink(plano?: string) {
  return {
    to: "/planos" as const,
    search: plano ? { from: "campanha" as const, plano } : { from: "campanha" as const },
  };
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
  const navigate = useNavigate();

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

  // Redireciona usuários logados e PRO direto para o app, mantendo a home como landing pública.
  // Como não temos acesso ao contexto de auth aqui, a verificação é feita em cada rota que usa esse componente.

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background pb-24 text-foreground md:pb-0">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_70%_at_50%_-10%,_oklch(0.78_0.2_141_/_0.18),_transparent_55%)]" />

      {/* Social proof strip */}
      <div className="relative border-b border-border/60 bg-card/80 shadow-soft backdrop-blur">
        <p className="animate-in fade-in slide-in-from-top-2 mx-auto max-w-6xl px-5 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-primary duration-700 sm:text-xs">
          {CAMPANHA.socialProof}
        </p>
      </div>

      {/* Hero */}
      <section className="relative mx-auto flex min-h-[calc(100svh-2.75rem)] w-full max-w-6xl flex-col justify-center px-5 py-14 sm:px-8 md:py-20">
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
            <Button asChild size="lg" className="h-14 w-full px-8 text-base font-extrabold sm:w-auto sm:min-w-[240px]">
              <Link {...planosLink(CAMPANHA.heroCtaPlano)}>{CAMPANHA.heroCta}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-14 w-full px-8 text-base font-extrabold sm:w-auto sm:min-w-[240px]"
            >
              <Link {...planosLink("semestral")}>{CAMPANHA.heroCtaSecundario}</Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{CAMPANHA.heroCtaHint}</p>

          <div className="mt-10 max-w-lg rounded-[1.5rem] border border-border/60 bg-card/90 p-5 shadow-soft">
            <p className="text-[11px] font-bold uppercase tracking-wide text-primary">{CAMPANHA.teaserTreino.titulo}</p>
            <p className="mt-2 text-lg font-extrabold text-foreground">{CAMPANHA.teaserTreino.nome}</p>
            <p className="mt-1 text-sm text-muted-foreground">{CAMPANHA.teaserTreino.descricao}</p>
            <p className="mt-2 text-xs font-semibold text-foreground">{CAMPANHA.teaserTreino.duracao} · preview</p>
            {CAMPANHA.teaserTreino.videoSrc ? (
              <video
                className="mt-4 aspect-video w-full rounded-2xl object-cover"
                src={CAMPANHA.teaserTreino.videoSrc}
                controls
                playsInline
                preload="none"
              />
            ) : (
              <div className="mt-4 flex aspect-video items-center justify-center rounded-2xl bg-secondary text-xs text-muted-foreground">
                Vídeo do método — cole a URL em campanha-copy.ts
              </div>
            )}
          </div>
        </div>
      </section>

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
          {CAMPANHA.prova.depoimentos.map((d) => (
            <blockquote
              key={d.autor}
              className="rounded-[1.25rem] border border-border/60 bg-background/60 p-5 shadow-soft"
            >
              <p className="text-sm font-medium leading-relaxed text-foreground">&ldquo;{d.quote}&rdquo;</p>
              <footer className="mt-3 text-xs font-bold text-primary">{d.autor}</footer>
            </blockquote>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {CAMPANHA.prova.slots.map((slot) => (
            <div
              key={slot.title}
              className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-border bg-background/40 px-4 text-center"
            >
              <ProofMedia slot={slot} />
            </div>
          ))}
        </div>
      </Section>

      {/* Oferta */}
      <Section id="oferta">
        <Eyebrow>Oferta</Eyebrow>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{CAMPANHA.oferta.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">Você recebe:</p>
        <ul className="mt-4 space-y-2">
          {CAMPANHA.oferta.recebe.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-foreground">
              <Check className="h-4 w-4 text-primary" /> {item}
            </li>
          ))}
        </ul>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {PLANOS_ASSINATURA.map((p) => {
            const badge =
              p.id === "semestral"
                ? CAMPANHA.oferta.badges.semestral
                : p.id === "anual"
                  ? CAMPANHA.oferta.badges.anual
                  : null;
            return (
              <Link
                key={p.id}
                {...planosLink(p.id)}
                className={cn(
                  "block rounded-[1.5rem] border p-5 shadow-soft transition-colors hover:border-primary/50",
                  p.destaque ? "border-primary bg-primary/10" : "border-border/60 bg-card",
                )}
              >
                {badge ? (
                  <p className="text-[11px] font-bold uppercase tracking-widest text-primary">{badge}</p>
                ) : (
                  <p className="text-[11px] font-bold uppercase tracking-widest text-transparent">.</p>
                )}
                <p className="mt-2 text-lg font-extrabold text-foreground">{p.nome}</p>
                <p className="mt-1 text-3xl font-black text-foreground">
                  {p.preco}
                  <span className="text-sm font-medium text-muted-foreground">{p.periodo}</span>
                </p>
                <p className="mt-2 text-xs text-muted-foreground">{p.nota}</p>
              </Link>
            );
          })}
        </div>

        <Button asChild size="lg" className="mt-8 h-14 w-full text-base font-extrabold md:w-auto md:min-w-[280px]">
          <Link {...planosLink("semestral")}>{CAMPANHA.oferta.cta}</Link>
        </Button>
      </Section>

      {/* Urgência */}
      <Section>
        <h2 className="max-w-2xl text-2xl font-extrabold tracking-tight sm:text-3xl">{CAMPANHA.urgencia.title}</h2>
        <p className="mt-3 text-lg font-semibold text-primary sm:text-xl">{CAMPANHA.urgencia.body}</p>
        <Button asChild size="lg" className="mt-8 h-14 w-full text-base font-extrabold sm:w-auto sm:min-w-[240px]">
          <Link {...planosLink(CAMPANHA.heroCtaPlano)}>{CAMPANHA.urgencia.cta}</Link>
        </Button>
        <div className="mt-6 flex flex-wrap gap-2">
          {CAMPANHA.ctaVariacoes.map((label) => (
            <Link
              key={label}
              {...planosLink("semestral")}
              className="rounded-full border border-border/60 bg-card px-3 py-2 text-xs font-semibold text-muted-foreground shadow-soft transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {label}
            </Link>
          ))}
        </div>
      </Section>

      <footer className="relative border-t border-border px-5 py-8 text-center text-xs text-muted-foreground">
        {CAMPANHA.brand} — treinos guiados para evoluir no jogo
      </footer>

      {/* Sticky mobile CTA */}
      <div className="animate-in slide-in-from-bottom-4 fixed inset-x-0 bottom-0 z-50 p-3 duration-500 md:hidden">
        <div className="flex gap-2 rounded-[1.5rem] border border-border/60 bg-card/95 p-2 shadow-soft-lg backdrop-blur">
          <Button asChild size="lg" className="h-12 flex-1 text-xs font-extrabold">
            <Link {...planosLink(CAMPANHA.heroCtaPlano)}>{CAMPANHA.heroCta}</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 flex-1 text-xs font-extrabold">
            <Link {...planosLink("semestral")}>Semestral</Link>
          </Button>
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
