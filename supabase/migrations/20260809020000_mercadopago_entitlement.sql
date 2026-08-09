-- Mercado Pago entitlement fields (mantém colunas stripe_* legadas)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mp_payer_id text,
  ADD COLUMN IF NOT EXISTS mp_payment_id text;

CREATE OR REPLACE FUNCTION public.enforce_subscription_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_role text := coalesce(auth.jwt() ->> 'role', '');
BEGIN
  IF jwt_role = 'service_role' OR current_user IN ('postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.assinante := false;
    NEW.plano := NULL;
    NEW.stripe_customer_id := NULL;
    NEW.stripe_subscription_id := NULL;
    NEW.mp_payer_id := NULL;
    NEW.mp_payment_id := NULL;
    RETURN NEW;
  END IF;

  IF NEW.assinante IS DISTINCT FROM OLD.assinante
     OR NEW.plano IS DISTINCT FROM OLD.plano
     OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
     OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id
     OR NEW.mp_payer_id IS DISTINCT FROM OLD.mp_payer_id
     OR NEW.mp_payment_id IS DISTINCT FROM OLD.mp_payment_id THEN
    RAISE EXCEPTION 'subscription fields are read-only for clients';
  END IF;

  RETURN NEW;
END;
$$;
