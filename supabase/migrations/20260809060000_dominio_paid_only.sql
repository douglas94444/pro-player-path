-- Domínio paid-only: perfil enriquecido, scores, UTM, afiliados, cancel, ligas

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS objetivo text,
  ADD COLUMN IF NOT EXISTS disponibilidade text,
  ADD COLUMN IF NOT EXISTS posicao text DEFAULT 'qualquer',
  ADD COLUMN IF NOT EXISTS cancel_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS affiliate_code text,
  ADD COLUMN IF NOT EXISTS referred_by text,
  ADD COLUMN IF NOT EXISTS reminder_hour int DEFAULT 20,
  ADD COLUMN IF NOT EXISTS telegram_joined boolean DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_affiliate_code_uidx
  ON public.profiles (affiliate_code)
  WHERE affiliate_code IS NOT NULL;

ALTER TABLE public.payment_events
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS utm_term text,
  ADD COLUMN IF NOT EXISTS affiliate_ref text;

CREATE TABLE IF NOT EXISTS public.weekly_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  week_start date NOT NULL,
  explosao int NOT NULL CHECK (explosao BETWEEN 1 AND 5),
  controle int NOT NULL CHECK (controle BETWEEN 1 AND 5),
  resistencia int NOT NULL CHECK (resistencia BETWEEN 1 AND 5),
  jogou boolean NOT NULL DEFAULT false,
  nota text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);

ALTER TABLE public.weekly_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own weekly scores" ON public.weekly_scores;
CREATE POLICY "Users manage own weekly scores" ON public.weekly_scores
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read affiliate clicks" ON public.affiliate_clicks;
CREATE POLICY "Admins read affiliate clicks" ON public.affiliate_clicks
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Anyone can insert affiliate click" ON public.affiliate_clicks;
CREATE POLICY "Anyone can insert affiliate click" ON public.affiliate_clicks
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.league_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  week_start date NOT NULL,
  treinos int NOT NULL DEFAULT 0,
  minutos int NOT NULL DEFAULT 0,
  streak_peak int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);

ALTER TABLE public.league_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read league" ON public.league_entries;
CREATE POLICY "Users read league" ON public.league_entries
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users upsert own league" ON public.league_entries;
CREATE POLICY "Users upsert own league" ON public.league_entries
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.escolinha_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text NOT NULL,
  telefone text,
  escolinha text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.escolinha_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone insert escolinha lead" ON public.escolinha_leads;
CREATE POLICY "Anyone insert escolinha lead" ON public.escolinha_leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins read escolinha leads" ON public.escolinha_leads;
CREATE POLICY "Admins read escolinha leads" ON public.escolinha_leads
  FOR SELECT TO authenticated
  USING (public.is_admin());
