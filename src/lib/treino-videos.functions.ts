import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { urlVideoSegura, MENSAGEM_URL_INVALIDA } from "@/lib/video-url";

const VIDEO_MIME_PERMITIDOS = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"];
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

const alvoSchema = z.object({
  treinoId: z.string().trim().min(1).max(80),
  exercicioNome: z.string().trim().max(120).nullable(),
});

const linkSchema = alvoSchema.extend({
  url: z.string().trim().min(1).max(2000),
  titulo: z.string().trim().max(200).nullable().optional(),
});

const uploadSchema = alvoSchema.extend({
  storagePath: z
    .string()
    .trim()
    .min(1)
    .max(300)
    .regex(/^[a-z0-9][a-z0-9/_.-]*$/i, "caminho inválido"),
  mime: z.string().trim().max(100),
  tamanho: z.number().int().positive(),
  titulo: z.string().trim().max(200).nullable().optional(),
});

async function garantirAdmin(supabase: SupabaseClient<Database>) {
  const { data } = await supabase.rpc("is_admin");
  if (!data) throw new Error("Apenas administradores podem gerenciar vídeos");
}

/** Salva/atualiza um link de vídeo — valida admin e allowlist de domínio. */
export const salvarLinkVideoServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => linkSchema.parse(input))
  .handler(async ({ data, context }) => {
    await garantirAdmin(context.supabase);

    const url = urlVideoSegura(data.url);
    if (!url) throw new Error(MENSAGEM_URL_INVALIDA);

    const { supabase } = context;
    const anterior = await buscarRegistro(supabase, data.treinoId, data.exercicioNome);

    if (anterior) {
      const { error } = await supabase
        .from("treino_videos")
        .update({ tipo: "link", url, storage_path: null, titulo: data.titulo ?? null })
        .eq("id", anterior.id);
      if (error) throw new Error(error.message);
      return { ok: true, storagePathAnterior: anterior.storage_path };
    }

    const { error } = await supabase.from("treino_videos").insert({
      treino_id: data.treinoId,
      exercicio_nome: data.exercicioNome,
      tipo: "link",
      url,
      storage_path: null,
      titulo: data.titulo ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true, storagePathAnterior: null as string | null };
  });

/** Registra o metadado de um arquivo enviado ao bucket — valida tipo e tamanho. */
export const registrarUploadVideoServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => uploadSchema.parse(input))
  .handler(async ({ data, context }) => {
    await garantirAdmin(context.supabase);

    if (!VIDEO_MIME_PERMITIDOS.includes(data.mime)) {
      throw new Error("Formato não aceito. Envie MP4, WebM ou MOV.");
    }
    if (data.tamanho > MAX_VIDEO_BYTES) {
      throw new Error("Arquivo muito grande. Limite de 200 MB.");
    }

    const { supabase } = context;
    const anterior = await buscarRegistro(supabase, data.treinoId, data.exercicioNome);

    if (anterior) {
      const { error } = await supabase
        .from("treino_videos")
        .update({
          tipo: "upload",
          storage_path: data.storagePath,
          url: null,
          titulo: data.titulo ?? null,
        })
        .eq("id", anterior.id);
      if (error) throw new Error(error.message);
      return { ok: true, storagePathAnterior: anterior.storage_path };
    }

    const { error } = await supabase.from("treino_videos").insert({
      treino_id: data.treinoId,
      exercicio_nome: data.exercicioNome,
      tipo: "upload",
      storage_path: data.storagePath,
      url: null,
      titulo: data.titulo ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true, storagePathAnterior: null as string | null };
  });

type SupabaseLike = {
  from: (table: "treino_videos") => any;
};

async function buscarRegistro(
  supabase: SupabaseLike,
  treinoId: string,
  exercicioNome: string | null,
) {
  let q = supabase.from("treino_videos").select("id, storage_path").eq("treino_id", treinoId);
  q = exercicioNome === null ? q.is("exercicio_nome", null) : q.eq("exercicio_nome", exercicioNome);
  const { data } = await q.maybeSingle();
  return (data as { id: string; storage_path: string | null } | null) ?? null;
}
