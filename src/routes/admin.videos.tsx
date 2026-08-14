import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Link2, Trash2, Upload, Video } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { TREINOS } from "@/data/training";
import {
  enviarVideoArquivo,
  listTreinoVideos,
  MAX_VIDEO_MB,
  removerVideo,
  resolveVideoUrl,
  salvarLinkVideo,
  videoKey,
  type TreinoVideo,
} from "@/lib/treino-videos";
import { RouteError, RouteNotFound } from "@/components/RouteBoundary";

export const Route = createFileRoute("/admin/videos")({
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
  head: () => ({
    meta: [
      { title: "Vídeos dos treinos — Admin Jogador PRO" },
      { name: "description", content: "Envie vídeos ou cole links para cada treino e exercício." },
      { property: "og:title", content: "Vídeos dos treinos" },
      { property: "og:description", content: "Gerencie as demonstrações em vídeo do Jogador PRO." },
    ],
  }),
  component: AdminVideos,
});

function AdminVideos() {
  const [rows, setRows] = useState<TreinoVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [treinoId, setTreinoId] = useState(TREINOS[0]?.id ?? "");

  const recarregar = async () => {
    try {
      setRows(await listTreinoVideos());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar vídeos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void recarregar();
  }, []);

  const treino = useMemo(() => TREINOS.find((t) => t.id === treinoId), [treinoId]);
  const mapa = useMemo(() => {
    const m: Record<string, TreinoVideo> = {};
    for (const r of rows) if (r.treino_id === treinoId) m[videoKey(r.exercicio_nome)] = r;
    return m;
  }, [rows, treinoId]);

  const totalPorTreino = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of rows) m[r.treino_id] = (m[r.treino_id] ?? 0) + 1;
    return m;
  }, [rows]);

  return (
    <AdminShell
      title="Vídeos dos treinos"
      subtitle={`Envie arquivos (até ${MAX_VIDEO_MB} MB) ou cole links do YouTube/Vimeo.`}
    >
      {loading ? <p className="text-sm text-muted-foreground">Carregando…</p> : null}

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {TREINOS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTreinoId(t.id)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              t.id === treinoId
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground"
            }`}
          >
            {t.nome}
            {totalPorTreino[t.id] ? ` · ${totalPorTreino[t.id]}` : ""}
          </button>
        ))}
      </div>

      {treino ? (
        <div className="space-y-3">
          <VideoRow
            label="Vídeo de capa do treino"
            sub={`${treino.nome} — sessão completa`}
            treinoId={treino.id}
            exercicioNome={null}
            registro={mapa[""] ?? null}
            onChange={recarregar}
          />
          {treino.exercicios.map((ex) => (
            <VideoRow
              key={ex.nome}
              label={ex.nome}
              sub={`${ex.duracaoSeg}s · ${ex.demo ?? "cardio"}`}
              treinoId={treino.id}
              exercicioNome={ex.nome}
              registro={mapa[ex.nome] ?? null}
              onChange={recarregar}
            />
          ))}
        </div>
      ) : null}
    </AdminShell>
  );
}

function VideoRow({
  label,
  sub,
  treinoId,
  exercicioNome,
  registro,
  onChange,
}: {
  label: string;
  sub: string;
  treinoId: string;
  exercicioNome: string | null;
  registro: TreinoVideo | null;
  onChange: () => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [linkAberto, setLinkAberto] = useState(false);
  const [link, setLink] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    setPreview(null);
    if (registro) {
      void resolveVideoUrl(registro).then((u) => {
        if (ativo) setPreview(u);
      });
    }
    return () => {
      ativo = false;
    };
  }, [registro]);

  const run = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      await onChange();
      toast.success(ok);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falhou");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{label}</p>
          <p className="text-[11px] text-muted-foreground">{sub}</p>
        </div>
        <div className="flex items-center gap-2">
          {registro ? (
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
              {registro.tipo === "upload" ? "Arquivo" : "Link"}
            </span>
          ) : (
            <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground">
              Sem vídeo
            </span>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              void run(() => enviarVideoArquivo({ treinoId, exercicioNome, file }), "Vídeo enviado");
            }}
          />
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => inputRef.current?.click()}>
            <Upload className="mr-1.5 h-4 w-4" /> Enviar
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => setLinkAberto((v) => !v)}>
            <Link2 className="mr-1.5 h-4 w-4" /> Link
          </Button>
          {registro ? (
            <Button
              size="icon"
              variant="ghost"
              disabled={busy}
              aria-label="Remover vídeo"
              onClick={() => void run(() => removerVideo(registro), "Vídeo removido")}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>

      {linkAberto ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://youtube.com/watch?v=… ou https://…/video.mp4"
            className="min-w-[240px] flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
          <Button
            size="sm"
            disabled={busy || !link.trim()}
            onClick={() =>
              void run(async () => {
                await salvarLinkVideo({ treinoId, exercicioNome, url: link.trim() });
                setLink("");
                setLinkAberto(false);
              }, "Link salvo")
            }
          >
            Salvar
          </Button>
        </div>
      ) : null}

      {busy ? <p className="mt-3 text-xs text-muted-foreground">Processando…</p> : null}

      {preview ? (
        <div className="mt-3 overflow-hidden rounded-xl border border-border">
          {/youtube\.com|youtu\.be|vimeo\.com/.test(preview) ? (
            <p className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
              <Video className="h-4 w-4" />
              <a href={preview} target="_blank" rel="noreferrer" className="truncate underline">
                {preview}
              </a>
            </p>
          ) : (
            <video src={preview} controls preload="metadata" className="max-h-56 w-full bg-black" />
          )}
        </div>
      ) : null}
    </div>
  );
}
