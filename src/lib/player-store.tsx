import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { PLANO_FLAT, TREINOS, getTreino, type Nivel } from "@/data/training";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";

const STORAGE_KEY = "jogador-pro-state-v1";

export type Sessao = { treinoId: string; data: string; minutos: number; planoKey?: string | undefined };


export type PlayerState = {
  nome: string;
  assinante: boolean;
  plano: string | null;
  sessoes: Sessao[];
  ultimoTreinoId: string | null;
};

const initialState: PlayerState = {
  nome: "Douglas",
  assinante: false,
  plano: null,
  sessoes: [],
  ultimoTreinoId: null,
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

type Ctx = {
  state: PlayerState;
  streak: number;
  nivel: Nivel;
  totalTreinos: number;
  totalMinutos: number;
  planoConcluidos: string[];
  proximoPlano: (typeof PLANO_FLAT)[number] | null;
  treinoDeHoje: ReturnType<typeof getTreino>;
  semanaAtual: number;
  progressoSemana: number;
  concluirTreino: (treinoId: string, planoKey?: string) => void;
  assinar: (plano: string) => void;
  cancelar: () => void;
  setNome: (n: string) => void;
  reset: () => void;
  sair: () => Promise<void>;
  hydrated: boolean;
  logado: boolean;
  email: string | null;
};

const PlayerContext = createContext<Ctx | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [state, setState] = useState<PlayerState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const logado = !!user;

  // Hidrata do dispositivo (visitante) ou do Supabase (logado)
  useEffect(() => {
    if (loading) return;
    let cancelado = false;

    async function carregar() {
      if (!user) {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          setState(raw ? { ...initialState, ...JSON.parse(raw) } : initialState);
        } catch {
          setState(initialState);
        }
        setHydrated(true);
        return;
      }

      const [{ data: perfil }, { data: sessoes }] = await Promise.all([
        supabase.from("profiles").select("nome, assinante, plano").eq("id", user.id).maybeSingle(),
        supabase.from("sessoes").select("treino_id, plano_key, data, minutos").eq("user_id", user.id).order("data", { ascending: true }),
      ]);
      if (cancelado) return;

      setState({
        nome: perfil?.nome ?? user.email?.split("@")[0] ?? "Jogador",
        assinante: perfil?.assinante ?? false,
        plano: perfil?.plano ?? null,
        sessoes: (sessoes ?? []).map((s) => ({
          treinoId: s.treino_id,
          data: s.data,
          minutos: s.minutos,
          planoKey: s.plano_key ?? undefined,
        })),
        ultimoTreinoId: sessoes?.length ? sessoes[sessoes.length - 1]!.treino_id : null,
      });
      setHydrated(true);
    }

    setHydrated(false);
    void carregar();
    return () => {
      cancelado = true;
    };
  }, [user, loading]);

  // Persiste no dispositivo apenas para visitantes
  useEffect(() => {
    if (!hydrated || logado) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hydrated, logado]);

  const salvarPerfil = useCallback(
    (patch: { nome?: string; assinante?: boolean; plano?: string | null }) => {
      if (!user) return;
      void supabase.from("profiles").upsert({ id: user.id, ...patch }, { onConflict: "id" });
    },
    [user],
  );

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

  const value = useMemo<Ctx>(() => {
    const planoConcluidos = state.sessoes.map((s) => s.planoKey).filter(Boolean) as string[];
    const unicos = Array.from(new Set(planoConcluidos));
    const proximo = PLANO_FLAT.find((p) => !unicos.includes(p.key)) ?? null;
    const totalTreinos = state.sessoes.length;
    const semanaAtual = proximo?.semana ?? 4;
    const feitosNaSemana = PLANO_FLAT.filter(
      (p) => p.semana === semanaAtual && unicos.includes(p.key),
    ).length;
    const totalSemana = PLANO_FLAT.filter((p) => p.semana === semanaAtual).length;

    return {
      state,
      hydrated,
      logado,
      email: user?.email ?? null,
      streak: calcStreak(state.sessoes),
      nivel: nivelPor(totalTreinos),
      totalTreinos,
      totalMinutos: state.sessoes.reduce((acc, s) => acc + s.minutos, 0),
      planoConcluidos: unicos,
      proximoPlano: proximo,
      treinoDeHoje: getTreino(proximo?.treinoId ?? TREINOS[0]!.id),
      semanaAtual,
      progressoSemana: Math.round((feitosNaSemana / totalSemana) * 100),
      concluirTreino,
      assinar: (plano: string) => {
        setState((s) => ({ ...s, assinante: true, plano }));
        salvarPerfil({ assinante: true, plano });
      },
      cancelar: () => {
        setState((s) => ({ ...s, assinante: false, plano: null }));
        salvarPerfil({ assinante: false, plano: null });
      },
      setNome: (nome: string) => {
        setState((s) => ({ ...s, nome }));
        salvarPerfil({ nome });
      },
      reset: () => {
        setState((s) => ({ ...s, sessoes: [], ultimoTreinoId: null }));
        if (user) void supabase.from("sessoes").delete().eq("user_id", user.id);
      },
      sair: async () => {
        await supabase.auth.signOut();
        setState(initialState);
      },
    };
  }, [state, hydrated, logado, user, concluirTreino, salvarPerfil]);

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}


export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer deve ser usado dentro de PlayerProvider");
  return ctx;
}
