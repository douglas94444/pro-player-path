import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
        setSession(s);
        setLoading(false);
      });
      supabase.auth.getSession().then(({ data }) => {
        setSession(data.session);
        setLoading(false);
      }).catch(() => setLoading(false));
      return () => sub.subscription.unsubscribe();
    } catch (err) {
      // Ambiente sem Supabase configurado: segue como visitante em vez de derrubar a tela.
      console.error("[auth] Supabase indisponível:", err);
      setSession(null);
      setLoading(false);
      return;
    }
  }, []);


  const user: User | null = session?.user ?? null;
  return { session, user, loading };
}
