CREATE TABLE public.treino_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  treino_id text NOT NULL,
  exercicio_nome text,
  tipo text NOT NULL DEFAULT 'link',
  url text,
  storage_path text,
  titulo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX treino_videos_unico
  ON public.treino_videos (treino_id, coalesce(exercicio_nome, ''));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.treino_videos TO authenticated;
GRANT ALL ON public.treino_videos TO service_role;

ALTER TABLE public.treino_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Logados leem videos" ON public.treino_videos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins gerenciam videos" ON public.treino_videos
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER update_treino_videos_updated_at
  BEFORE UPDATE ON public.treino_videos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Logados assistem treinos videos" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'treinos-videos');

CREATE POLICY "Admins enviam treinos videos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'treinos-videos' AND public.is_admin());

CREATE POLICY "Admins atualizam treinos videos" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'treinos-videos' AND public.is_admin());

CREATE POLICY "Admins apagam treinos videos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'treinos-videos' AND public.is_admin());