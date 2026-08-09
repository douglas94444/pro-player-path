import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { PLANO_FLAT, PLANO_MANUTENCAO, TREINOS, getTreino, type Nivel } from "@/data/training";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { ensureAdminRole } from "@/lib/admin";
import { maybeNotifyStreakOnOpen } from "@/lib/streak-reminder";

const STORAGE_KEY = "jogador-pro-state-v2";
const LEGACY_KEY = "jogador-pro-state-v1";
const ONBOARDING_KEY = "jogador-pro-onboarding-done";
const AUTH_PROMPT_KEY = "jogador-pro-auth-prompt-seen";

export type Sessao = { treinoId: string; data: string; minutos: number; planoKey?: string | undefined };

export type PlayerState = {
  nome: string;
  assinante: boolean;
  plano: string | null;
  role: "user" | "admin";
  sessoes: Sessao[];
  ultimoTreinoId: string | null;
  onboardingDone: boolean;
  objetivo: string | null;
  disponibilidade: string | null;
};

const initialState: PlayerState = {
  nome: "Jogador",
  assinante: false,
  plano: null,
  role: "user",
  sessoes: [],
  ultimoTreinoId: null,
  onboardingDone: false,
  objetivo: null,
  disponibilidade: null,
};

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

function diffDias(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function calcStreak(sessoes: Sessao[]) {
  const dias = Array.from(new Set(sessoes.map((s) => s.data))).sort().reverse();
  if (dias.length === 0) return 0;
  const d0 = diffDias(dias[0]!, hoje());
  if (d0 > 1) return 0;
  let streak = 1;
  for (let i = 1; i < dias.length; i++) {
    if (diffDias(dias[i]!, dias[i - 1]!) === 1) streak++;
    else break;
  }
  return streak;
}

export function nivelPor(treinos: number): Nivel {
  if (treinos >= 40) return "PRO";
  if (treinos >= 20) return "Avançado";
  if (treinos >= 6) return "Intermediário";
  return "Iniciante";
}

function lerLocal(): PlayerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (!raw) {
      const onboardingDone = localStorage.getItem(ONBOARDING_KEY) === "1";
      return { ...initialState, onboardingDone };
    }
    const parsed = JSON.parse(raw) as Partial<PlayerState>;
    const onboardingDone = Boolean(
      parsed.onboardingDone || localStorage.getItem(ONBOARDING_KEY) === "1",
    );
    return {
      ...initialState,
      ...parsed,
      nome: parsed.nome && parsed.nome !== "Douglas" ? parsed.nome : initialState.nome,
      // role só vem do servidor — nunca confiar no localStorage
      role: "user",
      onboardingDone,
      sessoes: Array.isArray(parsed.sessoes) ? parsed.sessoes : [],
    };
  } catch {
    return initialState;
  }
}

function mergeSessoes(local: Sessao[], remote: Sessao[]): Sessao[] {
  const map = new Map<string, Sessao>();
  for (const s of [...remote, ...local]) {
    const key = `${s.data}|${s.treinoId}|${s.planoKey ?? ""}|${s.minutos}`;
    map.set(key, s);
  }
  return Array.from(map.values()).sort((a, b) => a.data.localeCompare(b.data));
}

type ProximoPlano = {
  key: string;
  semana: number;
  dia: number;
  treinoId: string;
  premium?: boolean;
  manutencao?: boolean;
};

type Ctx = {
  state: PlayerState;
  streak: number;
  nivel: Nivel;
  totalTreinos: number;
  totalMinutos: number;
  planoConcluidos: string[];
  proximoPlano: ProximoPlano | null;
  treinoDeHoje: ReturnType<typeof getTreino>;
  semanaAtual: number;
  progressoSemana: number;
  planoCompleto: boolean;
  concluirTreino: (treinoId: string, planoKey?: string) => void;
  cancelar: () => Promise<{ error?: string }>;
  activateLocalPlan: (plano: string) => void;
  setNome: (n: string) => void;
  completeOnboarding: (data: { nome: string; objetivo: string; disponibilidade: string }) => void;
  markAuthPromptSeen: () => void;
  shouldPromptAuth: boolean;
  /** True para visitante que ainda não dispensou o prompt de conta. */
  canPromptAuth: boolean;
  refreshEntitlement: () => Promise<void>;
  reset: () => void;
  sair: () => Promise<void>;
  hydrated: boolean;
  logado: boolean;
  email: string | null;
  isAdmin: boolean;
};

const PlayerContext = createContext<Ctx | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [state, setState] = useState<PlayerState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [authPromptSeen, setAuthPromptSeen] = useState(false);
  const logado = !!user;

  useEffect(() => {
    try {
      setAuthPromptSeen(localStorage.getItem(AUTH_PROMPT_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    let cancelado = false;

    async function carregar() {
      if (!user) {
        setState(lerLocal());
        setHydrated(true);
        return;
      }

      const local = lerLocal();
      const role = await ensureAdminRole();
      const [{ data: perfil }, { data: sessoes }] = await Promise.all([
        supabase
          .from("profiles")
          .select("nome, assinante, plano, role")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("sessoes")
          .select("treino_id, plano_key, data, minutos")
          .eq("user_id", user.id)
          .order("data", { ascending: true }),
      ]);
      if (cancelado) return;

      const remoteSessoes: Sessao[] = (sessoes ?? []).map((s) => ({
        treinoId: s.treino_id,
        data: s.data,
        minutos: s.minutos,
        planoKey: s.plano_key ?? undefined,
      }));

      const merged = mergeSessoes(local.sessoes, remoteSessoes);

      // Sobe sessões locais que ainda não existem na nuvem
      const remoteKeys = new Set(
        remoteSessoes.map((s) => `${s.data}|${s.treinoId}|${s.planoKey ?? ""}|${s.minutos}`),
      );
      const paraSubir = merged.filter(
        (s) => !remoteKeys.has(`${s.data}|${s.treinoId}|${s.planoKey ?? ""}|${s.minutos}`),
      );
      if (paraSubir.length) {
        void supabase.from("sessoes").insert(
          paraSubir.map((s) => ({
            user_id: user.id,
            treino_id: s.treinoId,
            plano_key: s.planoKey ?? null,
            data: s.data,
            minutos: s.minutos,
          })),
        );
      }

      const nomeCloud = perfil?.nome ?? user.email?.split("@")[0] ?? "Jogador";
      const nomeFinal =
        local.nome && local.nome !== "Jogador" && local.nome !== "Douglas" && (!perfil?.nome || perfil.nome === "Jogador")
          ? local.nome
          : nomeCloud;

      if (nomeFinal !== perfil?.nome) {
        void supabase.from("profiles").upsert({ id: user.id, nome: nomeFinal }, { onConflict: "id" });
      }

      setState({
        nome: nomeFinal,
        assinante: perfil?.assinante ?? false,
        plano: perfil?.plano ?? null,
        role: perfil?.role === "admin" || role === "admin" ? "admin" : "user",
        sessoes: merged,
        ultimoTreinoId: merged.length ? merged[merged.length - 1]!.treinoId : null,
        onboardingDone: true,
        objetivo: local.objetivo,
        disponibilidade: local.disponibilidade,
      });
      try {
        localStorage.setItem(ONBOARDING_KEY, "1");
        localStorage.removeItem(LEGACY_KEY);
      } catch {
        /* ignore */
      }
      setHydrated(true);
    }

    setHydrated(false);
    void carregar();
    return () => {
      cancelado = true;
    };
  }, [user, loading]);

  useEffect(() => {
    if (!hydrated || logado) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (state.onboardingDone) localStorage.setItem(ONBOARDING_KEY, "1");
    } catch {
      /* ignore */
    }
  }, [state, hydrated, logado]);

  useEffect(() => {
    if (!hydrated) return;
    const treinouHoje = state.sessoes.some((s) => s.data === hoje());
    maybeNotifyStreakOnOpen(state.nome, calcStreak(state.sessoes), treinouHoje);
  }, [hydrated, state.nome, state.sessoes]);

  const salvarNome = useCallback(
    (nome: string) => {
      if (!user) return;
      void supabase.from("profiles").upsert({ id: user.id, nome }, { onConflict: "id" });
    },
    [user],
  );

  const refreshEntitlement = useCallback(async () => {
    if (!user) return;
    const { data: perfil } = await supabase
      .from("profiles")
      .select("assinante, plano, nome, role")
      .eq("id", user.id)
      .maybeSingle();
    if (!perfil) return;
    setState((s) => ({
      ...s,
      assinante: perfil.assinante,
      plano: perfil.plano,
      nome: perfil.nome || s.nome,
      role: perfil.role === "admin" ? "admin" : "user",
    }));
  }, [user]);

  const concluirTreino = useCallback(
    (treinoId: string, planoKey?: string) => {
      const t = getTreino(treinoId);
      const minutos = t?.duracaoMin ?? 10;
      const data = hoje();
      setState((s) => ({
        ...s,
        ultimoTreinoId: treinoId,
        sessoes: [...s.sessoes, { treinoId, data, minutos, planoKey }],
      }));
      if (user) {
        void supabase.from("sessoes").insert({
          user_id: user.id,
          treino_id: treinoId,
          plano_key: planoKey ?? null,
          data,
          minutos,
        });
      }
    },
    [user],
  );

  const activateLocalPlan = useCallback((plano: string) => {
    setState((s) => ({ ...s, assinante: true, plano }));
  }, []);

  const cancelar = useCallback(async () => {
    if (!user) {
      setState((s) => ({ ...s, assinante: false, plano: null }));
      return {};
    }
    const res = await supabase.functions.invoke("cancel-subscription", { body: {} });
    if (res.error) return { error: res.error.message };
    setState((s) => ({ ...s, assinante: false, plano: null }));
    return {};
  }, [user]);

  const value = useMemo<Ctx>(() => {
    const planoConcluidos = state.sessoes.map((s) => s.planoKey).filter(Boolean) as string[];
    const unicos = Array.from(new Set(planoConcluidos));
    const planoBaseFeito = PLANO_FLAT.every((p) => unicos.includes(p.key));
    let proximo: ProximoPlano | null = PLANO_FLAT.find((p) => !unicos.includes(p.key)) ?? null;

    if (!proximo && planoBaseFeito) {
      const feitosManut = unicos.filter((k) => k.startsWith("m-")).length;
      const idx = feitosManut % PLANO_MANUTENCAO.length;
      const dia = PLANO_MANUTENCAO[idx]!;
      proximo = {
        key: `m-${feitosManut + 1}`,
        semana: 5,
        dia: dia.dia,
        treinoId: dia.treinoId,
        premium: Boolean(getTreino(dia.treinoId)?.premium),
        manutencao: true,
      };
    }

    const totalTreinos = state.sessoes.length;
    const semanaAtual = proximo?.manutencao ? 5 : (proximo?.semana ?? (planoBaseFeito ? 5 : 4));
    const feitosNaSemana = proximo?.manutencao
      ? 0
      : PLANO_FLAT.filter((p) => p.semana === semanaAtual && unicos.includes(p.key)).length;
    const totalSemana = proximo?.manutencao
      ? PLANO_MANUTENCAO.length
      : PLANO_FLAT.filter((p) => p.semana === semanaAtual).length || 1;

    return {
      state,
      hydrated,
      logado,
      email: user?.email ?? null,
      isAdmin: state.role === "admin",
      streak: calcStreak(state.sessoes),
      nivel: nivelPor(totalTreinos),
      totalTreinos,
      totalMinutos: state.sessoes.reduce((acc, s) => acc + s.minutos, 0),
      planoConcluidos: unicos,
      proximoPlano: proximo,
      treinoDeHoje: getTreino(proximo?.treinoId ?? TREINOS[0]!.id),
      semanaAtual,
      progressoSemana: Math.round((feitosNaSemana / totalSemana) * 100),
      planoCompleto: planoBaseFeito,
      concluirTreino,
      activateLocalPlan,
      cancelar,
      refreshEntitlement,
      setNome: (nome: string) => {
        setState((s) => ({ ...s, nome }));
        salvarNome(nome);
      },
      completeOnboarding: ({ nome, objetivo, disponibilidade }) => {
        setState((s) => ({
          ...s,
          nome: nome.trim() || "Jogador",
          objetivo,
          disponibilidade,
          onboardingDone: true,
        }));
        try {
          localStorage.setItem(ONBOARDING_KEY, "1");
        } catch {
          /* ignore */
        }
        if (user) salvarNome(nome.trim() || "Jogador");
      },
      markAuthPromptSeen: () => {
        setAuthPromptSeen(true);
        try {
          localStorage.setItem(AUTH_PROMPT_KEY, "1");
        } catch {
          /* ignore */
        }
      },
      shouldPromptAuth: !logado && !authPromptSeen && totalTreinos >= 1,
      canPromptAuth: !logado && !authPromptSeen,
      reset: () => {
        setState((s) => ({ ...s, sessoes: [], ultimoTreinoId: null }));
        if (user) void supabase.from("sessoes").delete().eq("user_id", user.id);
      },
      sair: async () => {
        await supabase.auth.signOut();
        setState(lerLocal());
      },
    };
  }, [
    state,
    hydrated,
    logado,
    user,
    concluirTreino,
    activateLocalPlan,
    cancelar,
    refreshEntitlement,
    salvarNome,
    authPromptSeen,
  ]);

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer deve ser usado dentro de PlayerProvider");
  return ctx;
}
