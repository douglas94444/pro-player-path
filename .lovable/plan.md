Resumo da mudança
=================

Remover o segundo seletor de planos do checkout e fazer com que o card de plano principal (PlanosTable) seja o único ponto de ação. Quando o usuário clicar em "Quero o mensal/semestral/anual" no primeiro card, o checkout (Mercado Pago) deve abrir/avançar diretamente, sem precisar de um segundo card de seleção abaixo.

Contexto atual
==============

- `src/components/LandingPage.tsx` renderiza a seção `#oferta` com:
  1. `PlanosTable` — cards de planos (Mensal/Semestral/Anual) com CTA.
  2. `GarantiaBadge`.
  3. `CheckoutOferta` — possui seu próprio grid de 3 botões de planos + cupom + botão de pagamento + Brick do Mercado Pago.
- `PlanosTable` chama `dispararCheckout(plano, false)`, que só seleciona o plano no checkout, mas não abre o pagamento.
- `CheckoutOferta` contém o grid de planos (linhas 186-214) que duplica a escolha feita acima.

Problema
========

Dois cards/seletores de planos na mesma tela fazem a mesma ação (escolher plano). Isso confunde o usuário e dilui a conversão.

Mudanças propostas
==================

1. PlanosTable como único seletor + gatilho de checkout
   - Manter os 3 cards de planos visuais (Mensal, Semestral, Anual).
   - Alterar o CTA de cada card para abrir o checkout diretamente.
   - O botão clicado deve disparar `dispararCheckout(plano, true)` para que o Mercado Pago Brick seja exibido imediatamente.
   - Adicionar feedback visual no card ativo (quando o checkout abrir, destacar o plano escolhido).

2. CheckoutOferta sem seletor próprio
   - Remover o grid de 3 botões de planos (linhas 186-214 de `src/components/CheckoutOferta.tsx`).
   - Manter: campo de cupom, botão principal de pagamento, estado do Brick do Mercado Pago, e mensagens de segurança.
   - O `CheckoutOferta` passa a receber o plano já escolhido via evento e exibe apenas o fluxo de pagamento.

3. Integração com autenticação
   - Preservar a lógica existente: se não estiver logado, redirecionar para `/auth` e retornar ao checkout (`?checkout=1`).
   - Se já for assinante, mostrar botão "Ir para o app".

4. Ajustes de layout na seção #oferta
   - Manter a ordem: título → "Você recebe" → PlanosTable → Garantia → CheckoutOferta → Selos de confiança.
   - Ajustar espaçamentos para que o checkout expandido (Brick) fique visualmente conectado ao card de plano escolhido.

Arquivos envolvidos
===================

- `src/components/landing/PlanosTable.tsx`
- `src/components/CheckoutOferta.tsx`
- `src/components/LandingPage.tsx` (ajuste de espaçamento e ordem)

Critério de aceite
==================

- Ao clicar em "Quero o semestral" (ou mensal/anual) no PlanosTable, o checkout Mercado Pago Brick abre sem que haja um segundo seletor de planos abaixo.
- O plano escolhido reflete corretamente no valor e no checkout.
- A experiência de login/cupom/pagamento continua funcionando.
- Não há regressão visual (overflow, responsividade mobile 390px).

Não inclui neste plano
======================

- Mudanças de preços, copy, cores ou identidade visual.
- Alterações no backend, pagamento ou autenticação.
