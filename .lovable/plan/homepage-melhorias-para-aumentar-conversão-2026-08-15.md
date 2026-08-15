# Homepage: melhorias para aumentar conversão

Diagnóstico feito lendo a landing atual (`LandingPage.tsx` + `campanha-copy.ts`). A estrutura de copy está boa (problema → solução → prova → oferta), mas faltam elementos clássicos que destravam conversão: quebra de objeção, redução de risco, prova crível e caminho curto até o checkout.

## Problemas encontrados

1. **Sem cabeçalho.** Não existe barra no topo com logo, "Entrar" e CTA. Quem já é assinante não acha o login; quem rolou a página perde o CTA (o sticky só existe no mobile).
2. **Preço só aparece lá embaixo.** O herói diz "Começar agora por R$47", mas as 3 opções (47 / 147 / 197) só aparecem no fim. Sem ancoragem de preço, o R$47 parece caro isolado.
3. **Depoimentos assinados como "Perfil típico · lateral".** Isso lê como depoimento inventado e derruba a credibilidade da seção inteira de prova.
4. **Zero redução de risco.** Não há garantia, política de cancelamento, nem "cancela quando quiser" visível perto do botão de compra.
5. **Sem FAQ.** Objeções óbvias ficam sem resposta: funciona sem campo/material? Serve pra minha idade? Como pago? Posso cancelar? Tem app?
6. **Sem prova do produto.** A landing descreve o sistema, mas não mostra as telas (dashboard, streak, plano de 4 semanas, modo rápido). O maior diferencial — Modo Rápido "Tenho 10 minutos hoje" — nem é citado na home.
7. **Bloco de "variações de CTA" exposto.** As 4 pílulas ("Começar minha evolução", "Quero treinar como atleta"…) parecem sobra de teste e diluem a decisão.
8. **Vídeo do herói com `preload="none"` e sem play automático.** Poucos clicam; o preview do método fica invisível.
9. **Sem sinais de pagamento.** Pix / cartão / segurança não são mencionados antes do checkout.

## O que fazer

**1. Barra fixa no topo (desktop e mobile)**
Logo + "Entrar" + botão "Assinar" que rola até a oferta. Aparece com fundo sólido após ~80px de scroll.

**2. Ancoragem de preço no herói**
Abaixo do CTA: "A partir de R$16,41/mês no plano anual · Mensal R$47 sem fidelidade". Comparativo curto de ancoragem ("menos que 1 mensalidade de escolinha").

**3. Bloco "Veja por dentro" (novo)**
Grid com 3–4 capturas reais do app (dashboard com streak, plano de 4 semanas, tela de treino com timer, biblioteca), com legenda curta em cada. Entra logo após "Como funciona".

**4. Destacar o Modo Rápido**
Card próprio: "Sem tempo hoje? Toque em 'Tenho 10 minutos' e o app monta um treino curto e intenso." É o diferencial e hoje não aparece.

**5. Corrigir a prova social**
Trocar "Perfil típico · X" por depoimentos reais quando existirem. Enquanto não houver, remover as aspas fictícias e manter só prova visual honesta + contagem real de treinos concluídos na plataforma (consultada do banco), que é verdadeira e mais forte.

**6. Garantia e risco zero**
Selo de garantia (ex.: 7 dias) + "cancele quando quiser, sem multa" imediatamente acima e abaixo do checkout, com ícone de escudo.

**7. FAQ com acordeão (novo, antes da oferta final)**
8 perguntas: preciso de campo/material, idade mínima, quanto tempo por dia, funciona pra goleiro, formas de pagamento, como cancelo, tenho acesso no celular, o que acontece após as 4 semanas. Marcação JSON-LD `FAQPage` para SEO.

**8. Limpeza de CTA**
Remover as pílulas de variação. Padronizar em dois CTAs em toda a página: primário "Quero ser Jogador PRO" e secundário "Ver planos". Sticky mobile mantém só o primário + preço.

**9. Vídeo do herói**
`autoPlay muted loop playsInline` com poster, sem controles, como plano de fundo do card de preview — mostra movimento sem exigir clique.

**10. Sinais de confiança no checkout**
Linha com "Pix · Cartão · Pagamento seguro via Mercado Pago" acima do botão de pagar.

## Detalhes técnicos

- Todo o texto novo vai para `src/data/campanha-copy.ts` (garantia, FAQ, ancoragem de preço, modo rápido) — a landing continua só renderizando.
- Novos componentes: `src/components/landing/TopBar.tsx`, `FaqSection.tsx`, `AppShowcase.tsx`, `GarantiaBadge.tsx`; `LandingPage.tsx` só compõe.
- Capturas do app: gerar imagens em `src/assets/` e importar como ES module (lazy + `decoding="async"`).
- Contagem real de treinos: view agregada anônima já existente no padrão do projeto; se não houver, criar uma view somente-leitura com `GRANT SELECT ... TO anon` e cache de 1h via TanStack Query. Se ficar abaixo de um número apresentável, o bloco não é exibido.
- Tracking: manter `trackMeta`/`trackMetaCustom`; adicionar eventos de scroll-depth 50%/90% e clique em FAQ para medir onde a página perde gente.
- Tokens semânticos do design system apenas — sem cores hardcoded.
