-- P0: pause/entitlement, cupom atômico, vídeos por assinante, checkout_intents, crons.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pause_used_at timestamptz;

CREATE OR REPLACE FUNCTION public.enforce_subscription_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_role text := coalesce(auth.jwt() ->> 'role', '');
BEGIN
  IF jwt_role = 'service_role'
     OR current_user IN ('postgres', 'supabase_admin')
     OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.assinante := false;
    NEW.plano := NULL;
    NEW.assinante_until := NULL;
    NEW.stripe_customer_id := NULL;
    NEW.stripe_subscription_id := NULL;
    NEW.mp_payer_id := NULL;
    NEW.mp_payment_id := NULL;
    NEW.role := 'user';
    NEW.paused_until := NULL;
    NEW.pause_reason := NULL;
    NEW.pause_used_at := NULL;
    NEW.cancelled_at := NULL;
    NEW.cancel_reason := NULL;
    NEW.referred_by := NULL;
    RETURN NEW;
  END IF;

  IF NEW.assinante IS DISTINCT FROM OLD.assinante
     OR NEW.plano IS DISTINCT FROM OLD.plano
     OR NEW.assinante_until IS DISTINCT FROM OLD.assinante_until
     OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
     OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id
     OR NEW.mp_payer_id IS DISTINCT FROM OLD.mp_payer_id
     OR NEW.mp_payment_id IS DISTINCT FROM OLD.mp_payment_id
     OR NEW.role IS DISTINCT FROM OLD.role
     OR NEW.paused_until IS DISTINCT FROM OLD.paused_until
     OR NEW.pause_reason IS DISTINCT FROM OLD.pause_reason
     OR NEW.pause_used_at IS DISTINCT FROM OLD.pause_used_at
     OR NEW.cancelled_at IS DISTINCT FROM OLD.cancelled_at
     OR NEW.cancel_reason IS DISTINCT FROM OLD.cancel_reason
     OR NEW.referred_by IS DISTINCT FROM OLD.referred_by THEN
    RAISE EXCEPTION 'subscription/admin fields are read-only for clients';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_subscription_fields() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_subscription_fields() TO postgres, service_role;

CREATE OR REPLACE FUNCTION public.acesso_pro_ativo()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (select auth.uid())
      AND p.assinante = true
      AND (p.assinante_until IS NULL OR p.assinante_until > now())
      AND (p.paused_until IS NULL OR p.paused_until <= now())
  );
$$;

REVOKE ALL ON FUNCTION public.acesso_pro_ativo() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.acesso_pro_ativo() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.redeem_coupon(p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.coupons
  SET redemptions = redemptions + 1
  WHERE code = p_code
    AND active = true
    AND (max_redemptions IS NULL OR redemptions < max_redemptions);
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_coupon(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_coupon(text) TO service_role;

CREATE TABLE IF NOT EXISTS public.lifecycle_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  sent_on date NOT NULL DEFAULT ((now() AT TIME ZONE 'America/Sao_Paulo')::date),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, sent_on)
);

ALTER TABLE public.lifecycle_emails ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.lifecycle_emails FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.lifecycle_emails TO service_role;

ALTER TABLE public.checkout_intents
  DROP CONSTRAINT IF EXISTS checkout_intents_plano_check;
ALTER TABLE public.checkout_intents
  ADD CONSTRAINT checkout_intents_plano_check
  CHECK (plano IN ('mensal', 'semestral', 'anual'));

ALTER TABLE public.checkout_intents
  ADD COLUMN IF NOT EXISTS status text
  GENERATED ALWAYS AS (
    CASE
      WHEN purchased_at IS NOT NULL THEN 'purchased'
      WHEN recovered_at IS NOT NULL THEN 'recovered'
      ELSE 'seen'
    END
  ) STORED;

CREATE OR REPLACE FUNCTION public.enforce_checkout_intents()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_role text := coalesce(auth.jwt() ->> 'role', '');
BEGIN
  IF jwt_role = 'service_role'
     OR current_user IN ('postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.purchased_at := NULL;
    NEW.recovered_at := NULL;
    NEW.user_id := (select auth.uid());
    RETURN NEW;
  END IF;

  NEW.user_id := OLD.user_id;
  NEW.purchased_at := OLD.purchased_at;
  NEW.recovered_at := OLD.recovered_at;
  NEW.started_at := OLD.started_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_checkout_intents ON public.checkout_intents;
CREATE TRIGGER protect_checkout_intents
  BEFORE INSERT OR UPDATE ON public.checkout_intents
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_checkout_intents();

REVOKE ALL ON FUNCTION public.enforce_checkout_intents() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_checkout_intents() TO postgres, service_role;

DROP POLICY IF EXISTS "Logados leem videos" ON public.treino_videos;
CREATE POLICY "Assinantes leem videos" ON public.treino_videos
  FOR SELECT TO authenticated
  USING (public.is_admin() OR public.acesso_pro_ativo());

DROP POLICY IF EXISTS "Logados assistem treinos videos" ON storage.objects;
CREATE POLICY "Assinantes assistem treinos videos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'treinos-videos' AND (public.is_admin() OR public.acesso_pro_ativo()));

DROP POLICY IF EXISTS "Admins atualizam treinos videos" ON storage.objects;
CREATE POLICY "Admins atualizam treinos videos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'treinos-videos' AND public.is_admin())
  WITH CHECK (bucket_id = 'treinos-videos' AND public.is_admin());

DROP POLICY IF EXISTS "Qualquer pessoa pode enviar sugestão" ON public.sugestoes;
REVOKE INSERT ON public.sugestoes FROM anon, authenticated;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO postgres, service_role;

CREATE OR REPLACE FUNCTION private.cron_edge_headers()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  secret text;
BEGIN
  SELECT decrypted_secret INTO secret
  FROM vault.decrypted_secrets
  WHERE name = 'cron_secret'
  LIMIT 1;
  IF secret IS NULL OR btrim(secret) = '' THEN
    RAISE EXCEPTION 'vault secret cron_secret missing';
  END IF;
  RETURN jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || secret
  );
END;
$$;

REVOKE ALL ON FUNCTION private.cron_edge_headers() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  base_url text := 'https://zuqjyxcjftrtrhqxuvfq.supabase.co/functions/v1';
  jid bigint;
BEGIN
  PERFORM private.cron_edge_headers();

  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'send-checkout-recovery-hourly';
  IF jid IS NOT NULL THEN PERFORM cron.unschedule(jid); END IF;
  PERFORM cron.schedule(
    'send-checkout-recovery-hourly',
    '5 * * * *',
    format(
      $cron$select net.http_post(
        url := %L,
        headers := private.cron_edge_headers(),
        body := '{}'::jsonb
      );$cron$,
      base_url || '/send-checkout-recovery'
    )
  );

  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'send-streak-reminder-daily';
  IF jid IS NOT NULL THEN PERFORM cron.unschedule(jid); END IF;
  PERFORM cron.schedule(
    'send-streak-reminder-daily',
    '0 23 * * *',
    format(
      $cron$select net.http_post(
        url := %L,
        headers := private.cron_edge_headers(),
        body := '{}'::jsonb
      );$cron$,
      base_url || '/send-streak-reminder'
    )
  );

  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'send-winback-daily';
  IF jid IS NOT NULL THEN PERFORM cron.unschedule(jid); END IF;
  PERFORM cron.schedule(
    'send-winback-daily',
    '10 23 * * *',
    format(
      $cron$select net.http_post(
        url := %L,
        headers := private.cron_edge_headers(),
        body := '{}'::jsonb
      );$cron$,
      base_url || '/send-winback'
    )
  );
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'vault indisponível — crons HTTP não agendados';
  WHEN undefined_function THEN
    RAISE NOTICE 'pg_cron/pg_net/vault ausente — crons HTTP não agendados: %', SQLERRM;
  WHEN OTHERS THEN
    RAISE NOTICE 'crons HTTP: %', SQLERRM;
END $$;
