import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { fetchAdminPayments, type AdminPaymentRow } from "@/lib/admin";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { RouteError, RouteNotFound } from "@/components/RouteBoundary";

export const Route = createFileRoute("/admin/pagamentos")({
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
  component: AdminPagamentos,
});

function AdminPagamentos() {
  const [rows, setRows] = useState<AdminPaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchAdminPayments()
      .then(setRows)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Erro ao listar"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminShell title="Pagamentos" subtitle="Eventos Mercado Pago / webhooks">
      {loading ? <p className="text-sm text-muted-foreground">Carregando…</p> : null}

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Quando</th>
              <th className="px-4 py-3">Evento</th>
              <th className="px-4 py-3">Plano</th>
              <th className="px-4 py-3">Ref</th>
              <th className="px-4 py-3">User</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const approved = row.event_type.includes("approved");
              return (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(row.created_at).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-bold",
                        approved ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground",
                      )}
                    >
                      {row.event_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.plano ?? "—"}</td>
                  <td className="px-4 py-3 text-[11px] text-muted-foreground">
                    {row.stripe_event_id ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-[11px] text-muted-foreground">
                    {row.user_id ? `${row.user_id.slice(0, 8)}…` : "—"}
                  </td>
                </tr>
              );
            })}
            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum evento de pagamento ainda.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
