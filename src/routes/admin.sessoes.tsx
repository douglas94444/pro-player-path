import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { fetchAdminSessoes, type AdminSessaoRow } from "@/lib/admin";
import { getTreino } from "@/data/training";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/sessoes")({
  component: AdminSessoes,
});

function AdminSessoes() {
  const [rows, setRows] = useState<AdminSessaoRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchAdminSessoes()
      .then(setRows)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Erro ao listar"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminShell title="Sessões" subtitle="Treinos concluídos pelos jogadores">
      {loading ? <p className="text-sm text-muted-foreground">Carregando…</p> : null}

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Treino</th>
              <th className="px-4 py-3">Plano</th>
              <th className="px-4 py-3">Min</th>
              <th className="px-4 py-3">User</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const treino = getTreino(row.treino_id);
              return (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-4 py-3 text-foreground">
                    {new Date(row.data).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{treino?.nome ?? row.treino_id}</p>
                    <p className="text-[11px] text-muted-foreground">{row.treino_id}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.plano_key ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.minutos}</td>
                  <td className="px-4 py-3 text-[11px] text-muted-foreground">{row.user_id.slice(0, 8)}…</td>
                </tr>
              );
            })}
            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhuma sessão registrada.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
