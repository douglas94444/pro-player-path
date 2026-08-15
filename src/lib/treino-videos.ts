import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const TREINO_VIDEOS_BUCKET = "treinos-videos";
export const MAX_VIDEO_MB = 200;
/** Tipos aceitos no upload de vídeo (validado antes de enviar ao bucket). */
export const VIDEO_MIME_PERMITIDOS = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
] as const;

export type TreinoVideo = {
  id: string;
  treino_id: string;
  exercicio_nome: string | null;
  tipo: string;
  url: string | null;
  storage_path: string | null;
  titulo: string | null;
};

export type VideoMap = Record<string, string>;

/** Chave usada no mapa: "" = vídeo de capa do treino. */
export function videoKey(exercicioNome?: string | null) {
  return exercicioNome ?? "";
}

function slug(v: string) {
  return v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function listTreinoVideos(treinoId?: string): Promise<TreinoVideo[]> {
  let q = supabase.from("treino_videos").select("*");
  if (treinoId) q = q.eq("treino_id", treinoId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as TreinoVideo[];
}

/** Converte um registro em URL tocável (assina uploads do bucket privado). */
export async function resolveVideoUrl(v: TreinoVideo): Promise<string | null> {
  if (v.tipo === "upload" && v.storage_path) {
    const { data, error } = await supabase.storage
      .from(TREINO_VIDEOS_BUCKET)
      .createSignedUrl(v.storage_path, 60 * 60 * 6);
    if (error) return null;
    return data?.signedUrl ?? null;
  }
  return v.url ?? null;
}

export async function resolveVideoMap(rows: TreinoVideo[]): Promise<VideoMap> {
  const entries = await Promise.all(
    rows.map(async (r) => [videoKey(r.exercicio_nome), await resolveVideoUrl(r)] as const),
  );
  const map: VideoMap = {};
  for (const [k, url] of entries) if (url) map[k] = url;
  return map;
}

const VIDEO_MAP_VAZIO: VideoMap = {};

/**
 * Hook para o app do jogador: mapa de vídeos cadastrados para um treino.
 * Cacheado no TanStack Query — a URL assinada vale 6h, então mantemos os
 * dados frescos por 1h e evitamos refazer a query a cada montagem.
 */
export function useTreinoVideos(treinoId: string | undefined) {
  const { data } = useQuery({
    queryKey: ["treino-videos", treinoId],
    queryFn: async () => resolveVideoMap(await listTreinoVideos(treinoId)),
    enabled: Boolean(treinoId),
    staleTime: 60 * 60 * 1000,
    gcTime: 6 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  return data ?? VIDEO_MAP_VAZIO;
}

export async function salvarLinkVideo(input: {
  treinoId: string;
  exercicioNome: string | null;
  url: string;
  titulo?: string | null;
}) {
  const anterior = await buscarRegistro(input.treinoId, input.exercicioNome);
  if (anterior?.storage_path) await apagarArquivo(anterior.storage_path);

  const { error } = await supabase.from("treino_videos").upsert(
    {
      treino_id: input.treinoId,
      exercicio_nome: input.exercicioNome,
      tipo: "link",
      url: input.url,
      storage_path: null,
      titulo: input.titulo ?? null,
    },
    { onConflict: "treino_id,exercicio_nome" },
  );
  if (error) {
    // fallback quando o índice único é parcial (coalesce)
    if (anterior) {
      const { error: e2 } = await supabase
        .from("treino_videos")
        .update({ tipo: "link", url: input.url, storage_path: null, titulo: input.titulo ?? null })
        .eq("id", anterior.id);
      if (e2) throw e2;
      return;
    }
    throw error;
  }
}

export async function enviarVideoArquivo(input: {
  treinoId: string;
  exercicioNome: string | null;
  file: File;
}) {
  const { file, treinoId, exercicioNome } = input;
  if (!file.type.startsWith("video/")) throw new Error("Envie um arquivo de vídeo (MP4, WebM, MOV).");
  if (file.size > MAX_VIDEO_MB * 1024 * 1024)
    throw new Error(`Arquivo muito grande. Limite de ${MAX_VIDEO_MB} MB.`);

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp4";
  const nome = exercicioNome ? slug(exercicioNome) : "capa";
  const path = `${slug(treinoId)}/${nome}-${Date.now()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(TREINO_VIDEOS_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) throw upErr;

  const anterior = await buscarRegistro(treinoId, exercicioNome);
  if (anterior) {
    if (anterior.storage_path) await apagarArquivo(anterior.storage_path);
    const { error } = await supabase
      .from("treino_videos")
      .update({ tipo: "upload", storage_path: path, url: null, titulo: file.name })
      .eq("id", anterior.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("treino_videos").insert({
    treino_id: treinoId,
    exercicio_nome: exercicioNome,
    tipo: "upload",
    storage_path: path,
    url: null,
    titulo: file.name,
  });
  if (error) throw error;
}

export async function removerVideo(v: TreinoVideo) {
  if (v.storage_path) await apagarArquivo(v.storage_path);
  const { error } = await supabase.from("treino_videos").delete().eq("id", v.id);
  if (error) throw error;
}

/**
 * Remove o arquivo antigo do bucket. A falha não interrompe o fluxo (o registro
 * novo precisa ser salvo), mas é registrada para diagnosticar arquivos órfãos.
 */
async function apagarArquivo(path: string) {
  const { error } = await supabase.storage.from(TREINO_VIDEOS_BUCKET).remove([path]);
  if (error) {
    console.warn("[treino-videos] falha ao apagar arquivo antigo", path, error.message);
  }
}

async function buscarRegistro(treinoId: string, exercicioNome: string | null) {
  let q = supabase.from("treino_videos").select("*").eq("treino_id", treinoId);
  q = exercicioNome === null ? q.is("exercicio_nome", null) : q.eq("exercicio_nome", exercicioNome);
  const { data } = await q.maybeSingle();
  return (data as TreinoVideo | null) ?? null;
}
