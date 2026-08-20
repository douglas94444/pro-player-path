-- Período pago real (assinante_until), onboarding no perfil e intenção de checkout.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS assinante_until timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_done boolean NOT NULL DEFAULT false;

UPDATE public.profiles
SET onboarding_done = true
WHERE onboarding_done = false
  AND (objetivo IS NOT NULL OR assinante = true);

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
    RETURN NEW;
  END IF;

  IF NEW.assinante IS DISTINCT FROM OLD.assinante
     OR NEW.plano IS DISTINCT FROM OLD.plano
     OR NEW.assinante_until IS DISTINCT FROM OLD.assinante_until
     OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
     OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id
     OR NEW.mp_payer_id IS DISTINCT FROM OLD.mp_payer_id
     OR NEW.mp_payment_id IS DISTINCT FROM OLD.mp_payment_id
     OR NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'subscription/admin fields are read-only for clients';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_subscription_fields() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_subscription_fields() TO postgres, service_role;

CREATE TABLE IF NOT EXISTS public.checkout_intents (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plano text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  recovered_at timestamptz,
  purchased_at timestamptz
);

ALTER TABLE public.checkout_intents ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.checkout_intents FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.checkout_intents TO authenticated;
GRANT ALL ON TABLE public.checkout_intents TO service_role;

DROP POLICY IF EXISTS checkout_intents_select_own ON public.checkout_intents;
CREATE POLICY checkout_intents_select_own
  ON public.checkout_intents
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS checkout_intents_insert_own ON public.checkout_intents;
CREATE POLICY checkout_intents_insert_own
  ON public.checkout_intents
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS checkout_intents_update_own ON public.checkout_intents;
CREATE POLICY checkout_intents_update_own
  ON public.checkout_intents
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS checkout_intents_recovery_idx
  ON public.checkout_intents (last_seen_at)
  WHERE purchased_at IS NULL AND recovered_at IS NULL;

CREATE INDEX IF NOT EXISTS profiles_assinante_until_idx
  ON public.profiles (assinante_until)
  WHERE assinante = true AND assinante_until IS NOT NULL;

DO $$
DECLARE
  jid bigint;
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'expire-pro-access-hourly';
  IF jid IS NOT NULL THEN
    PERFORM cron.unschedule(jid);
  END IF;
  PERFORM cron.schedule(
    'expire-pro-access-hourly',
    '20 * * * *',
    $cron$UPDATE public.profiles
      SET assinante = false,
          cancel_reason = COALESCE(cancel_reason, 'expired'),
          cancelled_at = COALESCE(cancelled_at, now())
      WHERE assinante = true
        AND assinante_until IS NOT NULL
        AND assinante_until < now()$cron$
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'cron expire-pro-access-hourly: %', SQLERRM;
END $$;
