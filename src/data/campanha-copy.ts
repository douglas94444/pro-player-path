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
  heroCta: "Quero ser Jogador PRO",
  heroCtaPlano: "mensal" as const,
  heroCtaSecundario: "Ver planos",
  heroCtaHint: "Acesso completo ao plano de 4 semanas — sem freemium",
  precoAncora: "A partir de R$16,41/mês no plano anual · Mensal R$47, sem fidelidade",
  precoComparativo: "Menos que uma mensalidade de escolinha — e você treina todo dia.",

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

  showcase: {
    eyebrow: "Veja por dentro",
    title: "É isto que você abre todo dia.",
    body: "Nada de PDF ou playlist solta: um app com plano do dia, timer guiado e progresso registrado.",
    dashboard: "Dashboard com streak de dias e evolução por pilar",
    plano: "Plano de 4 semanas com progresso semana a semana",
    treino: "Tela de treino com timer e lista de exercícios",
  },

  modoRapido: {
    eyebrow: "Diferencial",
    title: "Sem tempo hoje? O treino se ajusta a você.",
    body: "Um toque e o sistema monta uma sessão curta e intensa que mantém seu streak vivo — em vez de você pular o dia e perder o ritmo.",
    botao: "Tenho 10 minutos hoje",
  },

  prova: {
    title: "O método em ação",
    body: "Prova visual do tipo de treino e do ritmo do sistema — sem números inventados nem depoimentos fabricados. Cases filmados dos assinantes entram aqui conforme forem gravados.",
    slots: PROVA_SLOTS as ProofSlot[],
  },

  garantia: {
    titulo: "Garantia de 7 dias",
    curta: "7 dias de garantia · cancele quando quiser",
    body: "Testou e não é pra você? Peça o reembolso em até 7 dias e devolvemos tudo. Assinatura sem fidelidade: você cancela quando quiser, sem multa.",
  },

  pagamento: "Pix · Cartão · Pagamento seguro via Mercado Pago",

  faq: [
    {
      pergunta: "Preciso de campo ou material especial?",
      resposta:
        "Não. Os treinos têm versões para casa, campo e academia. O básico é espaço para alguns passos e, quando pedido, uma bola.",
    },
    {
      pergunta: "Serve para a minha idade?",
      resposta:
        "O sistema foi desenhado para jovens atletas e adultos que jogam por prazer. A partir de 14 anos; abaixo disso, com acompanhamento de um responsável.",
    },
    {
      pergunta: "Quanto tempo por dia preciso?",
      resposta:
        "De 10 a 20 minutos. Em dias corridos, o Modo Rápido monta uma sessão de 10 minutos para você não perder o ritmo.",
    },
    {
      pergunta: "Funciona para goleiro?",
      resposta:
        "Os pilares de explosão, controle de corpo e performance servem a qualquer posição. A biblioteca permite filtrar o que faz sentido pro seu jogo.",
    },
    {
      pergunta: "Quais são as formas de pagamento?",
      resposta: "Pix, cartão de crédito e boleto, processados com segurança pelo Mercado Pago.",
    },
    {
      pergunta: "Como faço para cancelar?",
      resposta:
        "Pelo seu perfil, a qualquer momento. Não há fidelidade nem multa, e você mantém o acesso até o fim do período pago.",
    },
    {
      pergunta: "Consigo usar no celular?",
      resposta:
        "Sim. O app funciona no navegador do celular, tablet e computador, com o mesmo progresso sincronizado na nuvem.",
    },
    {
      pergunta: "O que acontece depois das 4 semanas?",
      resposta:
        "Você entra em novos ciclos com carga progressiva, além da biblioteca completa e dos modos pré-partida e pós-jogo.",
    },
  ],

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
    cta: "Quero ser Jogador PRO",
  },
} as const;


export { DEMO_VIDEOS };
