export type ProofSlot =
  | { type: "video"; src: string; title: string }
  | { type: "image"; src: string; title: string }
  | { type: "placeholder"; title: string };

export const CAMPANHA = {
  socialProof: "+2.000 jogadores já estão evoluindo com esse método",
  brand: "Jogador PRO System",
  headline: "Pare de treinar sem resultado.",
  headlineLead: "Siga um plano pronto e evolua como jogador em poucas semanas.",
  subheadline: "Mesmo treinando sozinho e com pouco tempo por dia.",
  heroCta: "Começar agora por R$47",
  heroCtaPlano: "mensal" as const,
  heroCtaGratis: "Treinar grátis agora",
  heroCtaGratisHint: "Semanas 1 e 2 liberadas — sinta o método antes de assinar",

  problemas: [
    "Você treina sem saber se está fazendo certo",
    "Cada dia faz um exercício diferente",
    "Não vê evolução no seu jogo",
    "Cansa rápido no campo",
  ],
  quebra: {
    title: "O problema não é você.",
    body: "É a falta de um plano.",
  },

  solucao: {
    eyebrow: "Apresentando",
    title: "Jogador PRO System",
    body: "Um sistema de treinos guiados que te mostra exatamente o que fazer, todos os dias.",
    passos: ["Abre o treino do dia", "Segue o passo a passo", "Evolui com consistência"],
  },

  comoFunciona: {
    plano: {
      title: "Plano estruturado",
      body: "Você não precisa pensar.",
      semanas: [
        { semana: 1, label: "Base física" },
        { semana: 2, label: "Controle + Core" },
        { semana: 3, label: "Explosão" },
        { semana: 4, label: "Performance" },
      ],
    },
    tempo: {
      title: "Treinos rápidos",
      body: "Apenas 10 a 20 minutos por dia",
      para: ["Trabalha", "Estuda", "Não tem tempo"],
    },
    acesso: {
      title: "Acesso imediato",
      items: ["Celular", "Computador", "Onde quiser"],
    },
  },

  beneficios: [
    "Ganhar mais explosão",
    "Melhorar seu controle de corpo",
    "Aumentar resistência no jogo",
    "Evoluir no drible e movimentação",
    "Jogar com mais confiança",
  ],

  diferencial: {
    title: "Isso não é uma lista de exercícios.",
    body: "É um plano progressivo, criado para te tirar do nível atual e te levar para outro nível de jogo.",
    pontos: ["Te tirar do nível atual", "Te levar para outro nível de jogo"],
  },

  prova: {
    title: "Resultados em campo",
    body: "Mais de 2.000 jogadores já estão usando esses treinos para evoluir com consistência.",
    depoimentos: [
      {
        quote: "Treino de 15 min e já sinto diferença no arranque no campo.",
        autor: "Lucas, lateral",
      },
      {
        quote: "Antes eu improvisava. Agora abro o app e faço o dia.",
        autor: "Rafa, meia",
      },
      {
        quote: "Consegui manter streak de 12 dias treinando sozinho.",
        autor: "Pedro, atacante",
      },
    ],
    /** Cole URLs reais aqui quando tiver prints/vídeos */
    slots: [
      { type: "placeholder", title: "Cole seu vídeo de treino" },
      { type: "placeholder", title: "Cole print de visualizações" },
      { type: "placeholder", title: "Cole print de comentário" },
    ] as ProofSlot[],
  },

  oferta: {
    title: "Acesso completo ao Jogador PRO System",
    recebe: [
      "Plano guiado completo",
      "Treinos organizados por semanas",
      "Acesso à biblioteca de treinos",
      "Atualizações futuras",
    ],
    badges: {
      semestral: "Mais escolhido",
      anual: "Melhor valor",
    },
    cta: "Quero ser Jogador PRO",
  },

  urgencia: {
    title: "Você pode continuar treinando do jeito errado…",
    body: "ou começar hoje a evoluir com um plano.",
    cta: "Começar agora",
  },

  ctaVariacoes: [
    "Começar minha evolução",
    "Quero treinar como atleta",
    "Liberar meu acesso",
    "Virar Jogador PRO",
  ],
} as const;
