-- Save offer: pausa sem cancelar + cupons afiliado

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS paused_until timestamptz,
  ADD COLUMN IF NOT EXISTS pause_reason text;

CREATE TABLE IF NOT EXISTS public.coupons (
  code text PRIMARY KEY,
  discount_percent int NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 50),
  affiliate_code text,
  active boolean NOT NULL DEFAULT true,
  max_redemptions int,
  redemptions int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active coupons" ON public.coupons;
CREATE POLICY "Anyone can read active coupons" ON public.coupons
  FOR SELECT TO anon, authenticated
  USING (active = true);

DROP POLICY IF EXISTS "Admins manage coupons" ON public.coupons;
CREATE POLICY "Admins manage coupons" ON public.coupons
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT ON TABLE public.coupons TO anon, authenticated;
GRANT ALL ON TABLE public.coupons TO service_role;

INSERT INTO public.coupons (code, discount_percent, affiliate_code, active)
VALUES
  ('PRO10', 10, null, true),
  ('AMIGO15', 15, null, true)
ON CONFLICT (code) DO NOTHING;

ALTER TABLE public.payment_events
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS discount_percent int;
