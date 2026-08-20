-- P4: edges leem Vault (CRON/MP), leads só via server fn, role admin só service_role.

CREATE OR REPLACE FUNCTION public.vault_secret(p_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  secret text;
BEGIN
  IF p_name IS NULL OR p_name NOT IN ('cron_secret', 'mercadopago_webhook_secret') THEN
    RAISE EXCEPTION 'vault_secret: name not allowed';
  END IF;
  SELECT decrypted_secret INTO secret
  FROM vault.decrypted_secrets
  WHERE name = p_name
  LIMIT 1;
  RETURN secret;
END;
$$;

REVOKE ALL ON FUNCTION public.vault_secret(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.vault_secret(text) TO service_role;

CREATE OR REPLACE FUNCTION public.enforce_subscription_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_role text := coalesce(auth.jwt() ->> 'role', '');
  privileged boolean;
BEGIN
  privileged :=
    jwt_role = 'service_role'
    OR current_user IN ('postgres', 'supabase_admin');

  IF TG_OP = 'UPDATE' THEN
    IF NOT privileged AND NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'role is read-only for clients';
    END IF;
  ELSIF TG_OP = 'INSERT' AND NOT privileged THEN
    NEW.role := 'user';
  END IF;

  IF privileged OR public.is_admin() THEN
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

DROP POLICY IF EXISTS "Anyone insert escolinha lead" ON public.escolinha_leads;
DROP POLICY IF EXISTS "Anyone can insert affiliate click" ON public.affiliate_clicks;
REVOKE INSERT ON public.escolinha_leads FROM PUBLIC, anon, authenticated;
REVOKE INSERT ON public.affiliate_clicks FROM PUBLIC, anon, authenticated;
GRANT INSERT, SELECT ON public.escolinha_leads TO service_role;
GRANT INSERT, SELECT ON public.affiliate_clicks TO service_role;

CREATE OR REPLACE FUNCTION public.admin_search_users(p_q text DEFAULT '')
RETURNS TABLE (
  id uuid,
  nome text,
  assinante boolean,
  plano text,
  role text,
  created_at timestamptz,
  email text,
  mp_payment_id text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  q text := trim(coalesce(p_q, ''));
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  q := replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_');

  RETURN QUERY
  SELECT
    p.id,
    p.nome,
    p.assinante,
    p.plano,
    p.role,
    p.created_at,
    u.email::text,
    p.mp_payment_id
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE q = ''
     OR p.nome ILIKE '%' || q || '%' ESCAPE '\'
     OR u.email ILIKE '%' || q || '%' ESCAPE '\'
     OR p.id::text ILIKE '%' || q || '%' ESCAPE '\'
  ORDER BY p.created_at DESC
  LIMIT 200;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_search_users(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_search_users(text) TO authenticated, service_role;
