CREATE TABLE public.sugestoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  nome text NOT NULL,
  email text NOT NULL,
  tipo text NOT NULL DEFAULT 'sugestao',
  mensagem text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT INSERT ON public.sugestoes TO anon;
GRANT INSERT ON public.sugestoes TO authenticated;
GRANT ALL ON public.sugestoes TO service_role;

ALTER TABLE public.sugestoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer pessoa pode enviar sugestão"
ON public.sugestoes
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Apenas admins leem sugestões"
ON public.sugestoes
FOR SELECT
TO authenticated
USING (public.is_admin());