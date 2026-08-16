# Juntar seções Planos e Oferta na homepage

## Objetivo
Unificar as seções "Planos" e "Oferta" da landing page em um único bloco de oferta, eliminando a separação entre os cards de planos e o checkout.

## Escopo

### O que será feito
1. Criar um único componente/section na landing page que combine:
   - Título e subtítulo de apresentação dos planos.
   - Cards dos planos (`PlanosTable`) como seletor de plano.
   - Checkout de pagamento (`CheckoutOferta`) logo abaixo dos cards.
   - Garantia, selos de confiança e lista de inclusos no mesmo bloco.
2. Ajustar a navegação dos CTAs: botões dos cards de plano devem atualizar o plano selecionado no checkout ao invés de rolar para uma seção separada.
3. Remover a seção "Oferta" separada (id="oferta") e migrar o ponto de ancoragem para o novo bloco unificado.
4. Garantir que os links/CTAs existentes que apontam para `#oferta` continuem funcionando.

### O que não será feito
- Alterar preços, textos dos planos ou fluxo de pagamento.
- Modificar o `CheckoutOferta` internamente, apenas reposicioná-lo.
- Mudar a lógica de cupom, afiliados ou tracking do Mercado Pago.

## Implementação técnica

- Editar `src/components/LandingPage.tsx` para:
  - Substituir as duas sections separadas por uma única section com id="oferta".
  - Renderizar `<PlanosTable>` e `<CheckoutOferta>` dentro do mesmo bloco visual.
  - Ajustar o callback `onEscolher` para atualizar o plano do checkout sem scroll.
- Atualizar `src/data/campanha-copy.ts` para:
  - Unificar/renomear as copy de "planos" e "oferta" se necessário.
- Revisar a função `rolarParaOferta()` para garantir que o id de ancoragem continue apontando para o bloco correto.
- Verificar responsividade: manter o grid dos planos e o checkout empilhados no mobile e lado a lado no desktop quando possível.

## Critérios de aceitação
- Apenas uma seção de oferta aparece na landing page.
- Os cards de plano e o formulário de checkout estão visualmente conectados.
- CTA "Quero ser Jogador PRO" do hero e de outras seções rolam até o bloco unificado e abrem o checkout corretamente.
- Não há regressão no fluxo de pagamento, cupom ou redirecionamento pós-compra.
