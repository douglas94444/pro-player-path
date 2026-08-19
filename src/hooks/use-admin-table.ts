import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export function useAdminTable<T>(loader: () => Promise<T[]>) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    void loader()
      .then(setRows)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Erro ao listar"))
      .finally(() => setLoading(false));
  }, [loader]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { rows, loading, reload };
}
