import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { PLANO_FLAT, TREINOS, getTreino, type Nivel } from "@/data/training";

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
  hydrated: boolean;
};

const PlayerContext = createContext<Ctx | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlayerState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...initialState, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hydrated]);

  const concluirTreino = useCallback((treinoId: string, planoKey?: string) => {
    const t = getTreino(treinoId);
    setState((s) => ({
      ...s,
      ultimoTreinoId: treinoId,
      sessoes: [...s.sessoes, { treinoId, data: hoje(), minutos: t?.duracaoMin ?? 10, planoKey }],
    }));
  }, []);

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
      assinar: (plano: string) => setState((s) => ({ ...s, assinante: true, plano })),
      cancelar: () => setState((s) => ({ ...s, assinante: false, plano: null })),
      setNome: (nome: string) => setState((s) => ({ ...s, nome })),
      reset: () => setState(initialState),
    };
  }, [state, hydrated, concluirTreino]);

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer deve ser usado dentro de PlayerProvider");
  return ctx;
}
