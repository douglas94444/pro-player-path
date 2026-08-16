# Aumentar conversão da homepage (referência: página das 365 Receitas)

## O que a página de referência faz e a nossa não faz

Comparando a estrutura dela com a nossa landing atual (`/`):

| Elemento que converte | Referência | Nossa página |
|---|---|---|
| Barra de urgência com data limite no topo | sim | não (só social proof) |
| Grid de benefícios com ícones, escaneável | sim | parcial (texto longo) |
| "Veja o que você vai receber" com cards visuais de conteúdo | sim (8 receitas com foto) | não |
| Ancoragem de valor antes do preço | sim (bônus) | não (faremos sem bônus, ancorando o que já está incluso) |
| Tabela de planos lado a lado com "Mais vendida" e preço riscado | sim | não (checkout único) |
| Widget de avaliações: nota média, nº de avaliações, distribuição de estrelas, nome + data + foto | sim | parcial (depoimentos sem nota/estrutura) |
| CTA repetido depois de cada bloco | 5+ vezes | 3 vezes |
| Selos de confiança logo abaixo do CTA do hero | sim | parcial |

## O que vou implementar

1. **Barra de urgência no topo** com prazo da oferta e contagem regressiva, acima da TopBar.
2. **Grid de benefícios em ícones** (8 itens curtos) logo após o hero, substituindo o bloco de texto denso.
3. **Nova seção "Veja o que você vai treinar"**: 6–8 cards com thumbnail de treino real (usando os vídeos/prints que já temos) + nome + microcopy de resultado.
4. **Bloco "Tudo que está incluso"** no lugar do stack de bônus: lista o que o assinante já recebe (jornada de 12 meses, biblioteca completa, Modo Rápido, streak e XP, novos treinos) para ancorar valor antes do preço. Sem bônus, sem valores fictícios.
5. **Tabela de planos lado a lado**: Mensal x Anual, com badge "Mais escolhido", preço De/Por e lista de itens inclusos; ambos levam ao checkout já existente.
6. **Bloco de avaliações estruturado**: nota média, total de avaliações, barra de distribuição de estrelas e os depoimentos atuais com estrelas, iniciais e data. Só usarei números reais que você fornecer — nada inventado.
7. **Mais CTAs ancorados** em `#oferta` ao fim de cada seção nova, com o mesmo tracking Meta já usado.
8. **Selos abaixo do CTA principal**: acesso imediato, pagamento seguro, garantia de 7 dias.

## Detalhes técnicos

- Copy centralizada em `src/data/campanha-copy.ts` (novos blocos: `urgenciaBar`, `beneficiosIcones`, `preview`, `incluso`, `planos`, `avaliacoes`).
- Novos componentes em `src/components/landing/`: `UrgencyBar.tsx`, `BeneficiosGrid.tsx`, `PreviewTreinos.tsx`, `InclusoStack.tsx`, `PlanosTable.tsx`, `AvaliacoesWidget.tsx`.
- `LandingPage.tsx` apenas compõe as seções na nova ordem; sem mudança em backend, checkout ou pagamento.
- Tokens semânticos do tema (dark + verde neon), mobile-first, sem cor hardcoded.
- Mantém tracking existente (`InitiateCheckout`, scroll depth) nos novos CTAs.

## Perguntas antes de construir

- Qual nota média e quantas avaliações posso exibir de verdade? Sem esse dado, exibo só os depoimentos com estrelas, sem número agregado.
