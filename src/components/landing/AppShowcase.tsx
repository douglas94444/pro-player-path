import { Flame, Timer, Zap } from "lucide-react";
import { CAMPANHA } from "@/data/campanha-copy";

/**
 * "Veja por dentro" — mockups fiéis das telas do app renderizados em CSS
 * (sem fotos genéricas), para mostrar o produto antes da compra.
 */
export function AppShowcase() {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Dashboard + streak */}
      <Frame legenda={CAMPANHA.showcase.dashboard}>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <p className="min-w-0 truncate text-sm font-extrabold text-foreground">Olá, atleta</p>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-black text-primary">
            <Flame className="h-3.5 w-3.5" /> 7
          </span>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
            <div
              key={`${d}-${i}`}
              className={
                "grid h-8 place-items-center rounded-lg text-[10px] font-bold " +
                (i < 5 ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground")
              }
            >
              {d}
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          <Barra label="Técnica" pct={72} />
          <Barra label="Explosão" pct={54} />
          <Barra label="Performance" pct={38} />
        </div>
      </Frame>

      {/* Plano de 4 semanas */}
      <Frame legenda={CAMPANHA.showcase.plano}>
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Plano guiado</p>
        <ul className="mt-3 space-y-2">
          {[
            { s: 1, t: "Base física", pct: 100 },
            { s: 2, t: "Controle + Core", pct: 60 },
            { s: 3, t: "Explosão", pct: 0 },
            { s: 4, t: "Performance", pct: 0 },
          ].map((w) => (
            <li key={w.s} className="rounded-xl border border-border/60 bg-background/60 p-3">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                <span className="min-w-0 truncate text-sm font-semibold text-foreground">
                  Semana {w.s} · {w.t}
                </span>
                <span className="shrink-0 text-xs font-bold text-primary">{w.pct}%</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary" style={{ width: `${w.pct}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </Frame>

      {/* Tela de treino */}
      <Frame legenda={CAMPANHA.showcase.treino}>
        <div className="grid place-items-center rounded-2xl bg-secondary/60 py-6">
          <Timer className="h-6 w-6 text-primary" />
          <p className="mt-2 text-4xl font-black tabular-nums text-foreground">00:45</p>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Sprint curto · 3/8
          </p>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          {["Aquecimento dinâmico", "Condução em zigue-zague", "Sprint curto", "Core final"].map((e, i) => (
            <li
              key={e}
              className={
                "flex items-center gap-2 rounded-lg px-3 py-2 " +
                (i === 2 ? "bg-primary/10 font-bold text-foreground" : "text-muted-foreground")
              }
            >
              <span className="text-primary">{i < 2 ? "✓" : "•"}</span>
              <span className="min-w-0 truncate">{e}</span>
            </li>
          ))}
        </ul>
      </Frame>
    </div>
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
