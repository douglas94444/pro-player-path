import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { urlVideoSegura, MENSAGEM_URL_INVALIDA } from "@/lib/video-url";
import {
  salvarLinkVideoServer,
  registrarUploadVideoServer,
} from "@/lib/treino-videos.functions";

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
  // Validação de verdade acontece no servidor (admin + allowlist de domínio);
  // aqui só evitamos uma ida de rede com um link obviamente inválido.
  if (!urlVideoSegura(input.url)) throw new Error(MENSAGEM_URL_INVALIDA);

  const { storagePathAnterior } = await salvarLinkVideoServer({
    data: {
      treinoId: input.treinoId,
      exercicioNome: input.exercicioNome,
      url: input.url.trim(),
      titulo: input.titulo ?? null,
    },
  });

  const aviso = storagePathAnterior ? await apagarArquivo(storagePathAnterior) : null;
  return { aviso };
}

export async function enviarVideoArquivo(input: {
  treinoId: string;
  exercicioNome: string | null;
  file: File;
}) {
  const { file, treinoId, exercicioNome } = input;
  if (!VIDEO_MIME_PERMITIDOS.includes(file.type as (typeof VIDEO_MIME_PERMITIDOS)[number]))
    throw new Error("Formato não aceito. Envie MP4, WebM ou MOV.");
  if (file.size > MAX_VIDEO_MB * 1024 * 1024)
    throw new Error(`Arquivo muito grande. Limite de ${MAX_VIDEO_MB} MB.`);

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp4";
  const nome = exercicioNome ? slug(exercicioNome) : "capa";
  const path = `${slug(treinoId)}/${nome}-${Date.now()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(TREINO_VIDEOS_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) throw upErr;

  // O metadado é gravado pelo servidor, que revalida admin, tipo e tamanho.
  const { storagePathAnterior } = await registrarUploadVideoServer({
    data: {
      treinoId,
      exercicioNome,
      storagePath: path,
      mime: file.type,
      tamanho: file.size,
      titulo: file.name.slice(0, 200),
    },
  });

  const aviso = storagePathAnterior ? await apagarArquivo(storagePathAnterior) : null;
  return { aviso };
}


export async function removerVideo(v: TreinoVideo) {
  const aviso = v.storage_path ? await apagarArquivo(v.storage_path) : null;
  const { error } = await supabase.from("treino_videos").delete().eq("id", v.id);
  if (error) throw error;
  return { aviso };
}

/**
 * Remove um arquivo do bucket. A falha não interrompe o fluxo (o registro novo
 * precisa ser salvo), mas retorna um aviso para exibir na UI e registra no log
 * para diagnosticar arquivos órfãos.
 */
async function apagarArquivo(path: string): Promise<string | null> {
  try {
    const { error } = await supabase.storage.from(TREINO_VIDEOS_BUCKET).remove([path]);
    if (error) throw error;
    return null;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("[treino-videos] falha ao apagar arquivo antigo", path, msg);
    return `O vídeo antigo não pôde ser removido do armazenamento (${path}). Ele ficará ocupando espaço até ser apagado manualmente.`;
  }
}

async function buscarRegistro(treinoId: string, exercicioNome: string | null) {
  let q = supabase.from("treino_videos").select("*").eq("treino_id", treinoId);
  q = exercicioNome === null ? q.is("exercicio_nome", null) : q.eq("exercicio_nome", exercicioNome);
  const { data } = await q.maybeSingle();
  return (data as TreinoVideo | null) ?? null;
}
