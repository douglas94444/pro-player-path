-- Stripe entitlement fields + protect client writes to subscription columns

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

CREATE TABLE IF NOT EXISTS public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_event_id text UNIQUE,
  event_type text NOT NULL,
  plano text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_events TO authenticated;
GRANT ALL ON public.payment_events TO service_role;

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment events"
  ON public.payment_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.enforce_subscription_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_role text := coalesce(auth.jwt() ->> 'role', '');
BEGIN
  -- service_role / postgres may write entitlement fields
  IF jwt_role = 'service_role' OR current_user IN ('postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.assinante := false;
    NEW.plano := NULL;
    NEW.stripe_customer_id := NULL;
    NEW.stripe_subscription_id := NULL;
    RETURN NEW;
  END IF;

  IF NEW.assinante IS DISTINCT FROM OLD.assinante
     OR NEW.plano IS DISTINCT FROM OLD.plano
     OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
     OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id THEN
    RAISE EXCEPTION 'subscription fields are read-only for clients';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profiles_subscription ON public.profiles;
CREATE TRIGGER protect_profiles_subscription
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_subscription_fields();
