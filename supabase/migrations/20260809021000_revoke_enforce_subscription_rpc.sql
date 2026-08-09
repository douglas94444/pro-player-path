-- Trigger-only helper: não deve ser chamável via PostgREST/RPC
REVOKE ALL ON FUNCTION public.enforce_subscription_fields() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enforce_subscription_fields() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_subscription_fields() TO postgres, service_role;
