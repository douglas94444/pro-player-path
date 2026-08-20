-- Pausa é alívio de ritmo: o acesso PRO permanece ativo até assinante_until.
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
  );
$$;
