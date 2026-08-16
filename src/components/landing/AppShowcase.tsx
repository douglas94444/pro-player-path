import { Zap } from "lucide-react";
import { CAMPANHA } from "@/data/campanha-copy";
import planoAsset from "@/assets/app-plano.png.asset.json";
import dashboardAsset from "@/assets/app-dashboard.png.asset.json";
import treinosAsset from "@/assets/app-treinos.png.asset.json";

/**
 * "Veja por dentro" — prints reais do app em mockups de celular.
 */
export function AppShowcase() {
  return (
    <div className="mt-10 grid items-end gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
      <Phone
        src={planoAsset.url}
        alt="Tela Meu plano do app, com a jornada guiada de 12 meses"
        legenda={CAMPANHA.showcase.plano}
        className="lg:rotate-[-3deg]"
      />
      <Phone
        src={dashboardAsset.url}
        alt="Dashboard do app com meta da semana, patente e treino de hoje"
        legenda={CAMPANHA.showcase.dashboard}
        className="lg:z-10 lg:scale-[1.06]"
        destaque
      />
      <Phone
        src={treinosAsset.url}
        alt="Biblioteca de treinos do app com filtros por categoria"
        legenda={CAMPANHA.showcase.treino}
        className="sm:col-span-2 sm:mx-auto sm:max-w-sm lg:col-span-1 lg:mx-0 lg:max-w-none lg:rotate-[3deg]"
      />
    </div>
  );
}

function Phone({
  src,
  alt,
  legenda,
  className = "",
  destaque = false,
}: {
  src: string;
  alt: string;
  legenda: string;
  className?: string;
  destaque?: boolean;
}) {
  return (
    <figure className={`min-w-0 ${className}`}>
      <div
        className={`relative mx-auto w-full max-w-[15rem] rounded-[2.25rem] border bg-card p-2.5 shadow-soft ${
          destaque ? "border-primary/40 shadow-lg" : "border-border/70"
        }`}
      >
        <span className="absolute left-1/2 top-2.5 z-10 h-4 w-20 -translate-x-1/2 rounded-b-2xl bg-card" />
        <div className="relative aspect-[9/17] overflow-hidden rounded-[1.75rem] bg-background">
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover object-top"
          />
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      </div>
      <figcaption className="mx-auto mt-4 max-w-[16rem] text-center text-xs font-semibold text-muted-foreground">
        {legenda}
      </figcaption>
    </figure>
  );
}

export function ModoRapidoCard({ onCta }: { onCta: () => void }) {
  return (
    <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-primary/30 bg-card p-6 shadow-soft sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
            <Zap className="h-4 w-4" /> {CAMPANHA.modoRapido.eyebrow}
          </p>
          <h3 className="mt-3 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            {CAMPANHA.modoRapido.title}
          </h3>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            {CAMPANHA.modoRapido.body}
          </p>
        </div>
        <button
          type="button"
          onClick={onCta}
          className="w-full shrink-0 rounded-[1.25rem] border border-primary/40 bg-primary/10 px-6 py-5 text-left transition-colors hover:bg-primary/15 lg:w-auto"
        >
          <span className="block text-xs font-bold uppercase tracking-widest text-primary">Botão no app</span>
          <span className="mt-1 block text-lg font-black text-foreground">
            {CAMPANHA.modoRapido.botao}
          </span>
        </button>
      </div>
    </div>
  );
}

function Barra({ label, pct }: { label: string; pct: number }) {
  return (
    <div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <span className="min-w-0 truncate text-xs font-semibold text-muted-foreground">{label}</span>
        <span className="shrink-0 text-xs font-bold text-foreground">{pct}%</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Frame({ legenda, children }: { legenda: string; children: React.ReactNode }) {
  return (
    <figure className="rounded-[1.5rem] border border-border/60 bg-card/90 p-5 shadow-soft">
      <div className="rounded-[1.25rem] border border-border/50 bg-background/70 p-4">{children}</div>
      <figcaption className="mt-3 text-xs font-semibold text-muted-foreground">{legenda}</figcaption>
    </figure>
  );
}
