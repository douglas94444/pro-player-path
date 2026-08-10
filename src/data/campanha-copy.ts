import { DEMO_VIDEOS, PROVA_SLOTS, TEASER_TREINO_VIDEO } from "@/data/media";

export type ProofSlot =
  | { type: "video"; src: string; title: string }
  | { type: "image"; src: string; title: string }
  | { type: "placeholder"; title: string };

export const CAMPANHA = {
  socialProof: "Sistema diário para quem treina sozinho e quer evoluir no jogo",
  brand: "Jogador PRO System",
  headline: "Pare de treinar sem resultado.",
  headlineLead: "Siga um plano pronto e evolua como jogador em poucas semanas.",
  subheadline: "Mesmo treinando sozinho e com pouco tempo por dia.",
  heroCta: "Começar agora por R$47",
  heroCtaPlano: "mensal" as const,
  heroCtaSecundario: "Ver planos e preços",
  heroCtaHint: "Acesso completo ao plano de 4 semanas — sem freemium",
  teaserTreino: {
    titulo: "Preview do método",
    nome: "Base + Mobilidade · Dia 1",
    duracao: "14 min",
    descricao: "O primeiro treino do arco: aquecimento, ativação e ritmo — sem improvisar.",
    videoSrc: TEASER_TREINO_VIDEO,
  },

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
    title: "O método em ação",
    body: "Prova visual do tipo de treino e do ritmo do sistema — sem números inventados. Cases filmados dos assinantes entram aqui conforme forem gravados.",
    depoimentos: [
      {
        quote: "Treino de 15 min e já sinto diferença no arranque no campo.",
        autor: "Perfil típico · lateral",
      },
      {
        quote: "Antes eu improvisava. Agora abro o app e faço o dia.",
        autor: "Perfil típico · meia",
      },
      {
        quote: "Consegui manter streak treinando sozinho com pouco tempo.",
        autor: "Perfil típico · atacante",
      },
    ],
    slots: PROVA_SLOTS as ProofSlot[],
  },

  oferta: {
    title: "Acesso completo ao Jogador PRO System",
    recebe: [
      "Plano guiado completo (4 semanas)",
      "Biblioteca + modos pré-partida e pós-jogo",
      "Comunidade PRO no Telegram",
      "Histórico, streak e evolução na nuvem",
      "Atualizações e ciclos pós-plano",
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

export { DEMO_VIDEOS };
