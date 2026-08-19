import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CreditCard, Dumbbell, Users, Crown, TrendingUp } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { fetchAdminStats, exportFunilCsv } from "@/lib/admin";
import { PRODUCT } from "@/lib/product-config";
import { RouteError, RouteNotFound } from "@/components/RouteBoundary";

export const Route = createFileRoute("/admin/")({
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
  component: AdminDashboard,
});

type Stats = Awaited<ReturnType<typeof fetchAdminStats>>;

function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    void fetchAdminStats()
      .then(setStats)
      .catch((e) => setErro(e instanceof Error ? e.message : "Falha ao carregar"));
  }, []);

  const cards = [
    { label: "Usuários", value: stats?.usuarios ?? 0, icon: Users, to: "/admin/usuarios" as const },
    { label: "Assinantes PRO", value: stats?.assinantes ?? 0, icon: Crown, to: "/admin/usuarios" as const },
    { label: "Sessões", value: stats?.sessoes ?? 0, icon: Dumbbell, to: "/admin/sessoes" as const },
    { label: "Pagamentos", value: stats?.pagamentos ?? 0, icon: CreditCard, to: "/admin/pagamentos" as const },
  ];

  const cohort = stats?.cohort30d;

  return (
    <AdminShell title="Dashboard" subtitle="Funil, retenção e aquisição">
      {erro ? <p className="mb-4 text-sm text-destructive">{erro}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
          >
            <c.icon className="h-5 w-5 text-primary" />
            <p className="mt-4 text-3xl font-black text-foreground">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </Link>
        ))}
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Funil 7 dias</h2>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              Eventos de pagamento:{" "}
              <span className="font-bold text-foreground">{stats?.pagamentos7d ?? 0}</span>
            </li>
            <li>
              Aprovados: <span className="font-bold text-foreground">{stats?.aprovados7d ?? 0}</span>
            </li>
            <li>
              Cancelamentos (histórico):{" "}
              <span className="font-bold text-foreground">{stats?.cancelados ?? 0}</span>
            </li>
            <li>
              Cliques afiliado:{" "}
              <span className="font-bold text-foreground">{stats?.affiliateClicks ?? 0}</span>
            </li>
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-bold text-foreground">Ativação cohort (30d)</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              Ads/checkout → aprovados:{" "}
              <span className="font-bold text-foreground">{cohort?.aprovados ?? 0}</span>
            </li>
            <li>
              D0 (1º treino &lt;24h):{" "}
              <span className="font-bold text-foreground">
                {cohort?.d0 ?? 0} ({cohort?.d0Rate ?? 0}%)
              </span>
            </li>
            <li>
              D7 (treino ~dia 7):{" "}
              <span className="font-bold text-foreground">
                {cohort?.d7 ?? 0}/{cohort?.d7Elegivel ?? 0} ({cohort?.d7Rate ?? 0}%)
              </span>
            </li>
          </ul>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Meta: D0 ≥70% · D7 ≥40%. Use UTM nos ads para ler a tabela abaixo.
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-foreground">Funil por UTM (30d)</h2>
            <p className="mt-1 text-xs text-muted-foreground">checkout → aprovado → D0 → D7</p>
          </div>
          <button
            type="button"
            className="text-xs font-bold text-primary underline-offset-4 hover:underline"
            onClick={() => {
              if (stats?.funilPorUtm?.length) exportFunilCsv(stats.funilPorUtm);
            }}
            disabled={!stats?.funilPorUtm?.length}
          >
            Exportar CSV
          </button>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="pb-2 font-medium">Source</th>
                <th className="pb-2 font-medium">Events</th>
                <th className="pb-2 font-medium">Aprov.</th>
                <th className="pb-2 font-medium">D0</th>
                <th className="pb-2 font-medium">D7</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {(stats?.funilPorUtm ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-2">
                    Sem pagamentos com UTM ainda
                  </td>
                </tr>
              ) : (
                stats!.funilPorUtm.map((row) => (
                  <tr key={row.source} className="border-t border-border/50">
                    <td className="py-2 font-semibold text-foreground">{row.source}</td>
                    <td className="py-2">{row.checkouts}</td>
                    <td className="py-2">{row.aprovados}</td>
                    <td className="py-2">
                      {row.d0}{" "}
                      <span className="text-xs">({row.d0Rate}%)</span>
                    </td>
                    <td className="py-2">
                      {row.d7}{" "}
                      <span className="text-xs">({row.d7Rate}%)</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <h3 className="text-xs font-bold text-foreground">UTM top (7d)</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {(stats?.utmTop ?? []).length === 0 ? (
              <li>Sem eventos com UTM ainda</li>
            ) : (
              stats!.utmTop.map(([src, n]) => (
                <li key={src}>
                  {src}: <span className="font-bold text-foreground">{n}</span>
                </li>
              ))
            )}
          </ul>
          <p className="mt-3 text-[11px] text-muted-foreground">{PRODUCT.affiliateCommissionNote}</p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-bold text-foreground">Atalhos</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>
            Lead B2B:{" "}
            <Link to="/escolinhas" className="text-primary underline">
              /escolinhas
            </Link>
          </li>
          <li>
            Ranking:{" "}
            <Link to="/ranking" className="text-primary underline">
              /ranking
            </Link>
          </li>
          <li>Indicação: /?ref=CODIGO · cupons PRO10 / AMIGO15</li>
          <li>Ops secrets/crons: supabase/OPS.md</li>
        </ul>
      </section>
    </AdminShell>
  );
}
