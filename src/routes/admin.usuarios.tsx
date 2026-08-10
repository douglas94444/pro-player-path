import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { fetchAdminUsers, updateAdminUser, type AdminUserRow } from "@/lib/admin";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/usuarios")({
  component: AdminUsuarios,
});

function AdminUsuarios() {
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    setLoading(true);
    void fetchAdminUsers()
      .then(setRows)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Erro ao listar"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, []);

  const toggleAssinante = async (row: AdminUserRow) => {
    try {
      await updateAdminUser(row.id, {
        assinante: !row.assinante,
        plano: !row.assinante ? row.plano ?? "semestral" : null,
      });
      toast.success(!row.assinante ? "Assinatura liberada" : "Assinatura removida");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao atualizar");
    }
  };

  const toggleRole = async (row: AdminUserRow) => {
    try {
      await updateAdminUser(row.id, { role: row.role === "admin" ? "user" : "admin" });
      toast.success(row.role === "admin" ? "Admin removido" : "Admin concedido");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao atualizar role");
    }
  };

  return (
    <AdminShell title="Usuários" subtitle="Perfis, assinatura e papéis">
      {loading ? <p className="text-sm text-muted-foreground">Carregando…</p> : null}

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Plano</th>
              <th className="px-4 py-3">Desde</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <p className="font-semibold text-foreground">{row.nome}</p>
                  <p className="text-[11px] text-muted-foreground">{row.id.slice(0, 8)}…</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-bold uppercase",
                      row.role === "admin" ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {row.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.assinante ? row.plano ?? "PRO" : "sem plano"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(row.created_at).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" className="rounded-lg text-xs" onClick={() => void toggleAssinante(row)}>
                      {row.assinante ? "Remover PRO" : "Liberar PRO"}
                    </Button>
                    <Button size="sm" variant="ghost" className="rounded-lg text-xs" onClick={() => void toggleRole(row)}>
                      {row.role === "admin" ? "Tirar admin" : "Tornar admin"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum usuário ainda.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
