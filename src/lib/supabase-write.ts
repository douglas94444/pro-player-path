import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const QUEUE_KEY = "jogador-pro-write-queue-v1";

export type PendingWrite = {
  id: string;
  table: string;
  op: "insert" | "update" | "upsert";
  payload: Record<string, unknown>;
  match?: Record<string, unknown>;
  onConflict?: string;
  label: string;
  tries: number;
};

type WriteResult = { error: { message: string } | null };

function isOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

function lerFila(): PendingWrite[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as PendingWrite[]) : [];
  } catch {
    return [];
  }
}

function gravarFila(fila: PendingWrite[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(fila.slice(-30)));
  } catch {
    /* ignore */
  }
}

function enfileirar(item: Omit<PendingWrite, "id" | "tries">) {
  const fila = lerFila();
  fila.push({ ...item, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, tries: 0 });
  gravarFila(fila);
}

async function executar(item: PendingWrite): Promise<WriteResult> {
  // A tipagem gerada é por tabela; a fila é genérica por natureza.
  const query = supabase.from(item.table as never);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const q = query as any;
  if (item.op === "insert") return await q.insert(item.payload);
  if (item.op === "upsert") {
    return await q.upsert(item.payload, item.onConflict ? { onConflict: item.onConflict } : undefined);
  }
  let up = q.update(item.payload);
  for (const [k, v] of Object.entries(item.match ?? {})) up = up.eq(k, v);
  return await up;
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

let processando = false;

/** Reenvia as escritas que ficaram pendentes por falta de conexão. */
export async function flushWriteQueue(): Promise<void> {
  if (processando || isOffline()) return;
  const fila = lerFila();
  if (!fila.length) return;
  processando = true;
  const restantes: PendingWrite[] = [];
  let enviados = 0;
  try {
    for (const item of fila) {
      const { error } = await executar(item);
      if (error) {
        if (item.tries >= 4) continue; // desiste após 5 tentativas
        restantes.push({ ...item, tries: item.tries + 1 });
      } else {
        enviados++;
      }
    }
  } finally {
    gravarFila(restantes);
    processando = false;
  }
  if (enviados) toast.success("Dados sincronizados", { description: "Salvamos o que ficou pendente offline." });
}

export function startWriteQueue(): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => void flushWriteQueue();
  window.addEventListener("online", handler);
  void flushWriteQueue();
  return () => window.removeEventListener("online", handler);
}

/**
 * Executa uma escrita no Supabase mostrando toast em caso de erro.
 * Se `retry` for informado e o usuário estiver offline (ou a escrita falhar),
 * a operação entra na fila e é reenviada quando a conexão voltar.
 */
export async function safeWrite(
  label: string,
  run: () => PromiseLike<WriteResult>,
  retry?: Omit<PendingWrite, "id" | "tries" | "label">,
): Promise<boolean> {
  if (retry && isOffline()) {
    enfileirar({ ...retry, label });
    toast.message("Você está offline", { description: `${label} será salvo quando a conexão voltar.` });
    return false;
  }
  try {
    const { error } = await run();
    if (!error) return true;
    if (retry) {
      enfileirar({ ...retry, label });
      toast.error(`Não foi possível salvar: ${label}`, {
        description: "Vamos tentar de novo automaticamente.",
      });
    } else {
      toast.error(`Não foi possível salvar: ${label}`, { description: error.message });
    }
    return false;
  } catch (e) {
    if (retry) enfileirar({ ...retry, label });
    toast.error(`Não foi possível salvar: ${label}`, {
      description: e instanceof Error ? e.message : "Tente novamente.",
    });
    return false;
  }
}
