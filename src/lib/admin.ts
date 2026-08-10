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
  const since7 = new Date();
  since7.setDate(since7.getDate() - 7);
  const iso7 = since7.toISOString();

  const [users, sessoes, payments, assinantes, pagamentos7, cancelados, clicks] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("sessoes").select("id", { count: "exact", head: true }),
    supabase.from("payment_events").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("assinante", true),
    supabase
      .from("payment_events")
      .select("id, utm_source, utm_campaign, event_type, plano, created_at")
      .gte("created_at", iso7)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .not("cancel_reason", "is", null),
    supabase.from("affiliate_clicks").select("id", { count: "exact", head: true }),
  ]);

  const events7 = pagamentos7.data ?? [];
  const approved7 = events7.filter((e) => String(e.event_type).includes("approved")).length;
  const bySource: Record<string, number> = {};
  for (const e of events7) {
    const src = e.utm_source || "(direto)";
    bySource[src] = (bySource[src] ?? 0) + 1;
  }

  return {
    usuarios: users.count ?? 0,
    sessoes: sessoes.count ?? 0,
    pagamentos: payments.count ?? 0,
    assinantes: assinantes.count ?? 0,
    pagamentos7d: events7.length,
    aprovados7d: approved7,
    cancelados: cancelados.count ?? 0,
    affiliateClicks: clicks.count ?? 0,
    utmTop: Object.entries(bySource)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5),
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
    .select(
      "id, user_id, event_type, plano, stripe_event_id, created_at, payload, utm_source, utm_campaign, affiliate_ref",
    )
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
