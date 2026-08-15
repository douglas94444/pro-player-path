CREATE TABLE public.sugestoes_rate_limit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave text NOT NULL,
  janela timestamptz NOT NULL,
  envios integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX sugestoes_rate_limit_unico
  ON public.sugestoes_rate_limit (chave, janela);

GRANT ALL ON public.sugestoes_rate_limit TO service_role;

ALTER TABLE public.sugestoes_rate_limit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Somente servico gerencia rate limit"
  ON public.sugestoes_rate_limit
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_sugestoes_rate_limit_updated_at
  BEFORE UPDATE ON public.sugestoes_rate_limit
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();