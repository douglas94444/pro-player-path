import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CreditCard, Dumbbell, Users, Crown } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { fetchAdminStats } from "@/lib/admin";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const [stats, setStats] = useState({ usuarios: 0, sessoes: 0, pagamentos: 0, assinantes: 0 });
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    void fetchAdminStats()
      .then(setStats)
      .catch((e) => setErro(e instanceof Error ? e.message : "Falha ao carregar"));
  }, []);

  const cards = [
    { label: "Usuários", value: stats.usuarios, icon: Users, to: "/admin/usuarios" as const },
    { label: "Assinantes PRO", value: stats.assinantes, icon: Crown, to: "/admin/usuarios" as const },
    { label: "Sessões", value: stats.sessoes, icon: Dumbbell, to: "/admin/sessoes" as const },
    { label: "Pagamentos", value: stats.pagamentos, icon: CreditCard, to: "/admin/pagamentos" as const },
  ];

  return (
    <AdminShell title="Dashboard" subtitle="Visão geral do Jogador PRO System">
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

      <section className="mt-8 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-bold text-foreground">Atalhos</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>• Gerencie assinantes e papéis em Usuários</li>
          <li>• Acompanhe volume de treinos em Sessões</li>
          <li>• Audite webhooks/pagamentos Mercado Pago</li>
        </ul>
      </section>
    </AdminShell>
  );
}
