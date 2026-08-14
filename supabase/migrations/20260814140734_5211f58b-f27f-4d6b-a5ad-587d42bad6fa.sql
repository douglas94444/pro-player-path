-- 1. Idempotência no banco
DELETE FROM public.sessoes a
USING public.sessoes b
WHERE a.ctid < b.ctid
  AND a.user_id = b.user_id AND a.treino_id = b.treino_id AND a.data = b.data;

ALTER TABLE public.sessoes
  ADD CONSTRAINT sessoes_user_treino_data_key UNIQUE (user_id, treino_id, data);

-- 2. Revogar escrita direta do cliente em sessoes (server function usa service role)
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.sessoes;
REVOKE INSERT, UPDATE ON public.sessoes FROM authenticated, anon;

-- 3. league_entries: cliente só lê a própria linha; nada de escrita direta
DROP POLICY IF EXISTS "Users read league" ON public.league_entries;
DROP POLICY IF EXISTS "Users upsert own league" ON public.league_entries;
REVOKE INSERT, UPDATE, DELETE ON public.league_entries FROM authenticated, anon;
GRANT SELECT ON public.league_entries TO authenticated;
GRANT ALL ON public.league_entries TO service_role;

CREATE POLICY "Users read own league row"
  ON public.league_entries FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- 4. View de ranking sem user_id
CREATE OR REPLACE VIEW public.ranking_semanal
WITH (security_invoker = off) AS
SELECT
  le.week_start,
  COALESCE(p.nome, 'Jogador') AS nome,
  le.treinos,
  le.minutos,
  le.streak_peak,
  ROW_NUMBER() OVER (
    PARTITION BY le.week_start
    ORDER BY le.treinos DESC, le.minutos DESC, le.streak_peak DESC
  ) AS posicao
FROM public.league_entries le
LEFT JOIN public.profiles p ON p.id = le.user_id;

REVOKE ALL ON public.ranking_semanal FROM anon;
GRANT SELECT ON public.ranking_semanal TO authenticated;

-- 5. Restringir EXECUTE de funções internas
REVOKE ALL ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_subscription_fields() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_admin() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;