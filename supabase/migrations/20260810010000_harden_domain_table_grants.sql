-- Tight grants for domain tables (RLS still applies)
REVOKE ALL ON TABLE public.weekly_scores FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.weekly_scores TO authenticated;
GRANT ALL ON TABLE public.weekly_scores TO service_role;

REVOKE ALL ON TABLE public.league_entries FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.league_entries TO authenticated;
GRANT ALL ON TABLE public.league_entries TO service_role;

REVOKE ALL ON TABLE public.affiliate_clicks FROM anon;
GRANT INSERT ON TABLE public.affiliate_clicks TO anon, authenticated;
GRANT SELECT ON TABLE public.affiliate_clicks TO authenticated;
GRANT ALL ON TABLE public.affiliate_clicks TO service_role;

REVOKE ALL ON TABLE public.escolinha_leads FROM anon;
GRANT INSERT ON TABLE public.escolinha_leads TO anon, authenticated;
GRANT SELECT ON TABLE public.escolinha_leads TO authenticated;
GRANT ALL ON TABLE public.escolinha_leads TO service_role;
