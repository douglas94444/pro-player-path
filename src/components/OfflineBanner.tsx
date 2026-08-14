import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { startWriteQueue } from "@/lib/supabase-write";

/** Banner fixo de "sem conexão" + disparo da fila de retry ao voltar online. */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(navigator.onLine === false);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    const stop = startWriteQueue();
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
      stop();
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 bg-destructive px-4 py-2 text-xs font-bold text-destructive-foreground"
    >
      <WifiOff className="h-3.5 w-3.5" />
      Sem conexão — seu progresso será salvo quando a internet voltar
    </div>
  );
}
