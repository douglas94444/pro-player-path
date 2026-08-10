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

export type FunilUtmRow = {
  source: string;
  checkouts: number;
  aprovados: number;
  d0: number;
  d7: number;
  d0Rate: number;
  d7Rate: number;
};

export async function fetchAdminStats() {
  const since7 = new Date();
  since7.setDate(since7.getDate() - 7);
  const iso7 = since7.toISOString();

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);
  const iso30 = since30.toISOString();

  const [users, sessoes, payments, assinantes, pagamentos7, cancelados, clicks, cohortPayments] =
    await Promise.all([
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
      supabase
        .from("payment_events")
        .select("id, user_id, utm_source, event_type, created_at")
        .gte("created_at", iso30)
        .order("created_at", { ascending: true })
        .limit(500),
    ]);

  const events7 = pagamentos7.data ?? [];
  const approved7 = events7.filter((e) => String(e.event_type).includes("approved")).length;
  const bySource: Record<string, number> = {};
  for (const e of events7) {
    const src = e.utm_source || "(direto)";
    bySource[src] = (bySource[src] ?? 0) + 1;
  }

  // Cohort: primeira compra aprovada por user → sessão D0 (<24h) e D7 (sessão entre dia 6–8 ou qualquer nos 7d + ainda assinante)
  const firstApproved = new Map<string, { at: Date; source: string }>();
  for (const e of cohortPayments.data ?? []) {
    if (!e.user_id || !String(e.event_type).includes("approved")) continue;
    if (firstApproved.has(e.user_id)) continue;
    firstApproved.set(e.user_id, {
      at: new Date(e.created_at),
      source: e.utm_source || "(direto)",
    });
  }

  const userIds = Array.from(firstApproved.keys());
  const sessoesByUser = new Map<string, string[]>();
  if (userIds.length) {
    const { data: sess } = await supabase
      .from("sessoes")
      .select("user_id, created_at, data")
      .in("user_id", userIds)
      .limit(2000);
    for (const s of sess ?? []) {
      const list = sessoesByUser.get(s.user_id) ?? [];
      list.push(s.created_at || `${s.data}T12:00:00.000Z`);
      sessoesByUser.set(s.user_id, list);
    }
  }

  const bucket: Record<string, { checkouts: number; aprovados: number; d0: number; d7: number }> = {};
  // checkouts = todos eventos 30d por source; aprovados = first approved
  for (const e of cohortPayments.data ?? []) {
    const src = e.utm_source || "(direto)";
    if (!bucket[src]) bucket[src] = { checkouts: 0, aprovados: 0, d0: 0, d7: 0 };
    bucket[src].checkouts += 1;
  }

  let d0Total = 0;
  let d7Total = 0;
  const now = Date.now();
  for (const [uid, meta] of firstApproved) {
    const src = meta.source;
    if (!bucket[src]) bucket[src] = { checkouts: 0, aprovados: 0, d0: 0, d7: 0 };
    bucket[src].aprovados += 1;

    const times = (sessoesByUser.get(uid) ?? []).map((t) => new Date(t).getTime());
    const payAt = meta.at.getTime();
    const hasD0 = times.some((t) => t >= payAt && t <= payAt + 24 * 3600 * 1000);
    if (hasD0) {
      bucket[src].d0 += 1;
      d0Total += 1;
    }
    const ageMs = now - payAt;
    if (ageMs >= 7 * 24 * 3600 * 1000) {
      const hasD7 = times.some((t) => t >= payAt + 6 * 24 * 3600 * 1000 && t <= payAt + 8 * 24 * 3600 * 1000);
      if (hasD7) {
        bucket[src].d7 += 1;
        d7Total += 1;
      }
    }
  }

  const aprovadosCohort = firstApproved.size;
  const elegivelD7 = Array.from(firstApproved.values()).filter(
    (m) => now - m.at.getTime() >= 7 * 24 * 3600 * 1000,
  ).length;

  const funilPorUtm: FunilUtmRow[] = Object.entries(bucket)
    .map(([source, b]) => ({
      source,
      checkouts: b.checkouts,
      aprovados: b.aprovados,
      d0: b.d0,
      d7: b.d7,
      d0Rate: b.aprovados ? Math.round((b.d0 / b.aprovados) * 100) : 0,
      d7Rate: b.aprovados ? Math.round((b.d7 / b.aprovados) * 100) : 0,
    }))
    .sort((a, b) => b.aprovados - a.aprovados || b.checkouts - a.checkouts)
    .slice(0, 8);

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
    cohort30d: {
      aprovados: aprovadosCohort,
      d0: d0Total,
      d0Rate: aprovadosCohort ? Math.round((d0Total / aprovadosCohort) * 100) : 0,
      d7: d7Total,
      d7Elegivel: elegivelD7,
      d7Rate: elegivelD7 ? Math.round((d7Total / elegivelD7) * 100) : 0,
    },
    funilPorUtm,
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
