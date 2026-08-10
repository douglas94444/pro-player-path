export type Categoria = "casa" | "campo" | "forca" | "explosao" | "core";
export type Nivel = "Iniciante" | "Intermediário" | "Avançado" | "PRO";

export type Exercicio = {
  nome: string;
  duracaoSeg: number;
  dica: string;
  /** Hint visual no player (animação CSS). */
  demo?: "mobilidade" | "forca" | "cardio" | "core" | "bola";
  /** URL de vídeo curto de execução (MP4 ou embed). */
  videoUrl?: string;
};

export type Treino = {
  id: string;
  nome: string;
  descricao: string;
  duracaoMin: number;
  nivel: Nivel;
  categorias: Categoria[];
  exercicios: Exercicio[];
  premium: boolean;
  /** Tags de posição (lateral, meia, atacante, goleiro, qualquer). */
  posicoes?: string[];
  /** Momento da temporada: base | explosao | pre_partida | pos_jogo | manutencao. */
  temporada?: string;
};

export const CATEGORIAS: { id: Categoria; label: string; emoji: string }[] = [
  { id: "casa", label: "Em casa", emoji: "🏠" },
  { id: "campo", label: "Campo", emoji: "⚽" },
  { id: "forca", label: "Força", emoji: "💪" },
  { id: "explosao", label: "Explosão", emoji: "⚡" },
  { id: "core", label: "Core", emoji: "🧠" },
];

const ex = (
  nome: string,
  duracaoSeg: number,
  dica: string,
  demo: Exercicio["demo"] = "cardio",
  videoUrl?: string,
): Exercicio => ({
  nome,
  duracaoSeg,
  dica,
  demo,
  ...(videoUrl ? { videoUrl } : {}),
});

/**
 * Cole URLs MP4/YouTube nos exercícios da Semana 1 (prioridade Dia 1).
 * Ex.: ex("Mobilidade…", 60, "…", "mobilidade", "https://…/mobilidade.mp4")
 */
export const VIDEO_DEMO_NOTES =
  "Priorize filmar: mobilidade de quadril, agachamento, prancha, condução de bola e salto.";

export const TREINOS: Treino[] = [
  {
    id: "base-mobilidade",
    nome: "Base + Mobilidade",
    descricao: "Preparação articular e ativação para começar a semana forte.",
    duracaoMin: 14,
    nivel: "Iniciante",
    categorias: ["casa", "core"],
    premium: true,
    exercicios: [
      ex("Mobilidade de quadril", 60, "Movimento lento, sem dor.", "mobilidade"),
      ex("Agachamento livre", 45, "Joelho alinhado com o pé.", "forca"),
      ex("Prancha frontal", 40, "Abdômen contraído, quadril na linha.", "core"),
      ex("Afundo alternado", 60, "Tronco ereto, passo firme.", "forca"),
      ex("Corrida estacionária", 60, "Ritmo constante.", "cardio"),
      ex("Alongamento posterior", 55, "Respire fundo e solte.", "mobilidade"),
    ],
  },
  {
    id: "controle-bola",
    nome: "Controle de Bola",
    descricao: "Domínio, condução e primeiro toque.",
    duracaoMin: 16,
    nivel: "Iniciante",
    categorias: ["campo", "casa"],
    premium: true,
    exercicios: [
      ex("Toques com o peito do pé", 60, "Bola baixa e controlada.", "bola"),
      ex("Condução em zigue-zague", 75, "Toques curtos.", "bola"),
      ex("Domínio na parede", 60, "Amorteça e devolva.", "bola"),
      ex("Sola frente e trás", 45, "Pés rápidos.", "bola"),
      ex("Passe forte alternado", 60, "Trave o tornozelo.", "bola"),
    ],
  },
  {
    id: "core-forte",
    nome: "Core Blindado",
    descricao: "Estabilidade de tronco para não perder disputa.",
    duracaoMin: 12,
    nivel: "Intermediário",
    categorias: ["core", "casa"],
    premium: true,
    exercicios: [
      ex("Prancha isométrica", 45, "Não deixe o quadril cair.", "core"),
      ex("Prancha lateral direita", 35, "Corpo em linha reta.", "core"),
      ex("Prancha lateral esquerda", 35, "Corpo em linha reta.", "core"),
      ex("Abdominal remador", 45, "Controle a descida.", "core"),
      ex("Superman", 40, "Peito e pernas fora do chão.", "core"),
    ],
  },
  {
    id: "explosao-core",
    nome: "Explosão + Core",
    descricao: "Arranque, salto e estabilidade no mesmo bloco.",
    duracaoMin: 12,
    nivel: "Intermediário",
    categorias: ["explosao", "core"],
    premium: true,
    exercicios: [
      ex("Salto vertical", 40, "Aterrisse com joelho semiflexionado."),
      ex("Tiro de 10 metros", 50, "Explosão nos 3 primeiros passos."),
      ex("Agachamento com salto", 45, "Descida controlada."),
      ex("Prancha com toque no ombro", 45, "Quadril estável."),
      ex("Skipping alto", 40, "Joelho na altura do quadril."),
    ],
  },
  {
    id: "resistencia-campo",
    nome: "Resistência de Jogo",
    descricao: "Fôlego para aguentar os 90 minutos.",
    duracaoMin: 22,
    nivel: "Avançado",
    categorias: ["campo", "explosao"],
    premium: true,
    exercicios: [
      ex("Corrida contínua", 180, "Ritmo confortável."),
      ex("Tiros de 30 metros", 90, "Recupere andando."),
      ex("Vai e vem", 90, "Mude de direção rápido."),
      ex("Corrida com mudança de ritmo", 120, "Alterne forte e leve."),
      ex("Volta à calma", 90, "Respiração controlada."),
    ],
  },
  {
    id: "forca-pernas",
    nome: "Força de Pernas",
    descricao: "Base muscular para chute e disputa.",
    duracaoMin: 20,
    nivel: "Avançado",
    categorias: ["forca", "casa"],
    premium: true,
    exercicios: [
      ex("Agachamento búlgaro", 60, "Desça devagar."),
      ex("Passada longa", 60, "Joelho não passa do pé."),
      ex("Elevação de panturrilha", 50, "Amplitude total."),
      ex("Ponte de glúteo", 50, "Aperte o glúteo no topo."),
      ex("Isometria na parede", 60, "Aguente firme."),
    ],
  },
  {
    id: "rapido-10",
    nome: "Modo Rápido: Explosão 10",
    descricao: "Só 10 minutos, sem desculpa.",
    duracaoMin: 10,
    nivel: "Iniciante",
    categorias: ["casa", "explosao"],
    premium: true,
    exercicios: [
      ex("Polichinelo", 45, "Aquecimento rápido."),
      ex("Agachamento com salto", 40, "Explosivo."),
      ex("Prancha", 40, "Firme."),
      ex("Tiro curto no lugar", 40, "Máxima frequência."),
    ],
  },
  {
    id: "rapido-core",
    nome: "Modo Rápido: Core 10",
    descricao: "Core completo em 10 minutos.",
    duracaoMin: 10,
    nivel: "Iniciante",
    categorias: ["casa", "core"],
    premium: true,
    exercicios: [
      ex("Prancha", 45, "Sem cair o quadril."),
      ex("Abdominal infra", 40, "Controle."),
      ex("Prancha lateral", 40, "Cada lado."),
      ex("Superman", 40, "Segure 2 segundos."),
    ],
  },
  {
    id: "performance-final",
    nome: "Performance Total",
    descricao: "Circuito completo de jogador.",
    duracaoMin: 25,
    nivel: "PRO",
    categorias: ["campo", "explosao", "forca"],
    premium: true,
    temporada: "manutencao",
    exercicios: [
      ex("Aquecimento dinâmico", 90, "Solte as articulações."),
      ex("Tiros progressivos", 120, "Aumente a cada série."),
      ex("Saltos laterais", 60, "Aterrissagem suave."),
      ex("Condução em velocidade", 90, "Cabeça erguida."),
      ex("Finalizações", 90, "Pé de apoio firme."),
      ex("Volta à calma", 60, "Respire."),
    ],
  },
  {
    id: "pre-partida",
    nome: "Pré-partida 10",
    descricao: "Ativação rápida antes do jogo — 10 minutos.",
    duracaoMin: 10,
    nivel: "Intermediário",
    categorias: ["campo", "explosao"],
    premium: true,
    temporada: "pre_partida",
    posicoes: ["qualquer", "lateral", "meia", "atacante"],
    exercicios: [
      ex("Mobilidade de quadril", 45, "Solte sem forçar.", "mobilidade"),
      ex("Skipping alto", 40, "Joelho alto.", "cardio"),
      ex("Tiros curtos no lugar", 40, "Máxima frequência.", "cardio"),
      ex("Toques com o peito do pé", 45, "Ative o primeiro toque.", "bola"),
      ex("Respiração + foco", 30, "3 respirações profundas.", "mobilidade"),
    ],
  },
  {
    id: "pos-jogo",
    nome: "Pós-jogo recuperação",
    descricao: "Desaceleração e mobilidade depois da pelada.",
    duracaoMin: 12,
    nivel: "Iniciante",
    categorias: ["casa", "core"],
    premium: true,
    temporada: "pos_jogo",
    posicoes: ["qualquer"],
    exercicios: [
      ex("Caminhada leve no lugar", 60, "Baixe o ritmo.", "cardio"),
      ex("Alongamento posterior", 55, "Sem bounce.", "mobilidade"),
      ex("Mobilidade de quadril", 50, "Amplitude confortável.", "mobilidade"),
      ex("Prancha leve", 30, "Só ativar o core.", "core"),
      ex("Respiração diafragmática", 45, "Expire longo.", "mobilidade"),
    ],
  },
];

export function getTreino(id: string): Treino | undefined {
  return TREINOS.find((t) => t.id === id);
}

export type DiaPlano = { dia: number; treinoId: string };
export type SemanaPlano = {
  semana: number;
  titulo: string;
  foco: string;
  dias: DiaPlano[];
  /** Semanas 3–4 exigem assinatura no plano guiado. */
  premium?: boolean;
};

export const PLANO: SemanaPlano[] = [
  {
    semana: 1,
    titulo: "Semana 1 — Base",
    foco: "Construir base física e ritmo de treino",
    premium: true,
    dias: [
      { dia: 1, treinoId: "base-mobilidade" },
      { dia: 2, treinoId: "controle-bola" },
      { dia: 3, treinoId: "core-forte" },
      { dia: 4, treinoId: "rapido-10" },
      { dia: 5, treinoId: "base-mobilidade" },
    ],
  },
  {
    semana: 2,
    titulo: "Semana 2 — Controle + Core",
    foco: "Domínio de bola e estabilidade de tronco",
    premium: true,
    dias: [
      { dia: 1, treinoId: "controle-bola" },
      { dia: 2, treinoId: "core-forte" },
      { dia: 3, treinoId: "explosao-core" },
      { dia: 4, treinoId: "rapido-core" },
      { dia: 5, treinoId: "controle-bola" },
    ],
  },
  {
    semana: 3,
    titulo: "Semana 3 — Explosão",
    foco: "Arranque, salto e velocidade",
    premium: true,
    dias: [
      { dia: 1, treinoId: "explosao-core" },
      { dia: 2, treinoId: "forca-pernas" },
      { dia: 3, treinoId: "rapido-10" },
      { dia: 4, treinoId: "explosao-core" },
      { dia: 5, treinoId: "resistencia-campo" },
    ],
  },
  {
    semana: 4,
    titulo: "Semana 4 — Performance",
    foco: "Juntar tudo em ritmo de jogo",
    premium: true,
    dias: [
      { dia: 1, treinoId: "resistencia-campo" },
      { dia: 2, treinoId: "forca-pernas" },
      { dia: 3, treinoId: "explosao-core" },
      { dia: 4, treinoId: "controle-bola" },
      { dia: 5, treinoId: "performance-final" },
    ],
  },
];

/** Ciclo de manutenção após as 4 semanas (repete com chaves m-N). */
export const PLANO_MANUTENCAO: DiaPlano[] = [
  { dia: 1, treinoId: "base-mobilidade" },
  { dia: 2, treinoId: "controle-bola" },
  { dia: 3, treinoId: "explosao-core" },
  { dia: 4, treinoId: "core-forte" },
  { dia: 5, treinoId: "rapido-10" },
  { dia: 6, treinoId: "controle-bola" },
  { dia: 7, treinoId: "explosao-core" },
];

export const PLANO_FLAT = PLANO.flatMap((s) =>
  s.dias.map((d) => ({
    key: `${s.semana}-${d.dia}`,
    semana: s.semana,
    premium: Boolean(s.premium),
    ...d,
  })),
);

export const PLANOS_ASSINATURA = [
  {
    id: "mensal",
    nome: "Mensal",
    preco: "R$47",
    periodo: "/mês",
    destaque: false,
    nota: "Sem fidelidade",
    precoCentavos: 4700,
    intervalo: "month" as const,
    intervaloCount: 1,
  },
  {
    id: "semestral",
    nome: "Semestral",
    preco: "R$147",
    periodo: "/6 meses",
    destaque: true,
    nota: "Mais vendido — R$24,50/mês",
    precoCentavos: 14700,
    intervalo: "month" as const,
    intervaloCount: 6,
  },
  {
    id: "anual",
    nome: "Anual",
    preco: "R$197",
    periodo: "/ano",
    destaque: false,
    nota: "Melhor valor — R$16,41/mês",
    precoCentavos: 19700,
    intervalo: "year" as const,
    intervaloCount: 1,
  },
];

export const BENEFICIOS_PRO = [
  "Plano guiado completo (4 semanas)",
  "Biblioteca + pré-partida e pós-jogo",
  "Ciclos temáticos pós-plano (explosão / pré-pelada)",
  "Comunidade PRO + histórico na nuvem",
  "Scores semanais de evolução no campo",
];

export const POSICOES = [
  { id: "qualquer", label: "Qualquer posição" },
  { id: "lateral", label: "Lateral" },
  { id: "meia", label: "Meia" },
  { id: "atacante", label: "Atacante" },
  { id: "goleiro", label: "Goleiro" },
] as const;

/** Ciclos temáticos após as 4 semanas (além da manutenção base). */
export const CICLOS_TEMATICOS: { id: string; titulo: string; foco: string; treinoIds: string[] }[] = [
  {
    id: "explosao",
    titulo: "Ciclo Explosão",
    foco: "Arranque e potência por 7 dias",
    treinoIds: ["explosao-core", "forca-pernas", "rapido-10", "explosao-core", "resistencia-campo", "rapido-10", "performance-final"],
  },
  {
    id: "pre-pelada",
    titulo: "Ciclo Pré-pelada",
    foco: "Chegar afiado no jogo do fim de semana",
    treinoIds: ["pre-partida", "controle-bola", "explosao-core", "rapido-core", "pre-partida", "controle-bola", "pos-jogo"],
  },
];

export const CONQUISTAS = [
  { id: "primeiro", titulo: "Primeiro treino", desc: "Você começou 👊", meta: 1, tipo: "treinos" as const },
  { id: "streak7", titulo: "7 dias seguidos", desc: "Disciplina de atleta", meta: 7, tipo: "streak" as const },
  { id: "semana", titulo: "Semana completa", desc: "5 treinos do plano", meta: 5, tipo: "plano" as const },
  { id: "t30", titulo: "30 treinos feitos", desc: "Nível outro patamar", meta: 30, tipo: "treinos" as const },
];
