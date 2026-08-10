import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CreditCard, Dumbbell, Users, Crown, TrendingUp } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { fetchAdminStats } from "@/lib/admin";
import { PRODUCT } from "@/lib/product-config";

export const Route = createFileRoute("/admin/")({
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
            <li>Eventos de pagamento: <span className="font-bold text-foreground">{stats?.pagamentos7d ?? 0}</span></li>
            <li>Aprovados: <span className="font-bold text-foreground">{stats?.aprovados7d ?? 0}</span></li>
            <li>Cancelamentos (histórico): <span className="font-bold text-foreground">{stats?.cancelados ?? 0}</span></li>
            <li>Cliques afiliado: <span className="font-bold text-foreground">{stats?.affiliateClicks ?? 0}</span></li>
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-bold text-foreground">UTM top (7d)</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
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
          <p className="mt-4 text-[11px] text-muted-foreground">{PRODUCT.affiliateCommissionNote}</p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-bold text-foreground">Atalhos</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>• Lead B2B: <Link to="/escolinhas" className="text-primary underline">/escolinhas</Link></li>
          <li>• Ranking: <Link to="/ranking" className="text-primary underline">/ranking</Link></li>
          <li>• Indicação: /planos?ref=CODIGO</li>
        </ul>
      </section>
    </AdminShell>
  );
}
