Tornar os cards de plano clicáveis na landing page

## Objetivo
Restaurar a interatividade dos cards de plano para que o usuário consiga selecionar um plano diretamente neles, sem depender apenas dos CTAs do hero ou do checkout.

## Problema atual
- `src/components/landing/PlanosTable.tsx` renderiza os cards como blocos informativos estáticos (sem `onClick` ou botão).
- O estado `ativo` existe apenas para refletir o plano escolhido via checkout; não há input direto do usuário sobre o card.
- Isso gera a sensação de que "não deixa selecionar o plano".

## Escopo

### O que será feito
1. Tornar cada card de plano no `PlanosTable` clicável.
   - Adicionar `onClick` em cada card.
   - Atualizar o estado interno `ativo` com o plano clicado.
   - Disparar o evento `CHECKOUT_EVENT` com `iniciar: false` para sincronizar o `CheckoutOferta` sem abrir o Brick imediatamente.
   - Manter o estilo visual de seleção (`ring-primary`, `bg-primary/5`) que já existe.
2. Receber um callback `onSelecionar` via props no `PlanosTable` para que `LandingPage` atualize seu `planoAtivo` e mantenha o checkout sincronizado.
3. Garantir que o botão principal do checkout (`CheckoutOferta`) continue usando o plano selecionado.
4. Preservar acessibilidade: adicionar `role="button"`, `tabIndex={0}` e handler de `Enter`/`Space` nos cards.
5. Ajustar cursor (`cursor-pointer`) e hover states para deixar claro que os cards são clicáveis.

### O que não será feito
- Não abrir o Mercado Pago Brick automaticamente ao clicar no card (apenas seleciona o plano).
- Não alterar preços, copy, cores ou layout da grade.
- Não reintroduzir um botão de CTA dentro dos cards.

## Arquivos envolvidos
- `src/components/landing/PlanosTable.tsx`
- `src/components/LandingPage.tsx`

## Critérios de aceite
- Clicar em qualquer card de plano atualiza o destaque visual (ring) imediatamente.
- O checkout abaixo reflete o plano recém-selecionado no botão principal e no Brick (quando aberto).
- Teclado consegue navegar e selecionar os cards.
- A build continua passando sem erros de tipo.
- Não há regressão no fluxo de pagamento, cupom ou login.
