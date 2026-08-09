import { supabase } from "@/integrations/supabase/client";

export type AdminUserRow = {
  id: string;
  nome: string;
  assinante: boolean;
  plano: string | null;
  role: string;
  created_at: string;
  email?: string | null;
  mp_payment_id?: string | null;
};

export type AdminSessaoRow = {
  id: string;
  user_id: string;
  treino_id: string;
  plano_key: string | null;
  data: string;
  minutos: number;
  created_at: string;
  profiles?: { nome: string } | null;
};

export type AdminPaymentRow = {
  id: string;
  user_id: string | null;
  event_type: string;
  plano: string | null;
  stripe_event_id: string | null;
  created_at: string;
  payload: unknown;
};

export async function ensureAdminRole(): Promise<"admin" | "user"> {
  const { data, error } = await supabase.functions.invoke("ensure-admin-role", { body: {} });
  if (error) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return "user";
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    return profile?.role === "admin" ? "admin" : "user";
  }
  const role = (data as { role?: string } | null)?.role;
  return role === "admin" ? "admin" : "user";
}

export async function fetchAdminStats() {
  const [users, sessoes, payments, assinantes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("sessoes").select("id", { count: "exact", head: true }),
    supabase.from("payment_events").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("assinante", true),
  ]);

  return {
    usuarios: users.count ?? 0,
    sessoes: sessoes.count ?? 0,
    pagamentos: payments.count ?? 0,
    assinantes: assinantes.count ?? 0,
  };
}

export async function fetchAdminUsers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nome, assinante, plano, role, created_at, mp_payment_id")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as AdminUserRow[];
}

export async function fetchAdminSessoes() {
  const { data, error } = await supabase
    .from("sessoes")
    .select("id, user_id, treino_id, plano_key, data, minutos, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as AdminSessaoRow[];
}

export async function fetchAdminPayments() {
  const { data, error } = await supabase
    .from("payment_events")
    .select("id, user_id, event_type, plano, stripe_event_id, created_at, payload")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as AdminPaymentRow[];
}

export async function updateAdminUser(
  id: string,
  patch: { assinante?: boolean; plano?: string | null; role?: "user" | "admin"; nome?: string },
) {
  const { error } = await supabase.from("profiles").update(patch).eq("id", id);
  if (error) throw error;
}
