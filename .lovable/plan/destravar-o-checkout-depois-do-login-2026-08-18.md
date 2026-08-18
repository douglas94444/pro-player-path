# Destravar o checkout depois do login

## Diagnóstico confirmado

- O login retorna à homepage com os parâmetros do plano e de abertura do checkout.
- No preview atual, a oferta permanece em **“Preparando seu checkout…”** e o botão fica desabilitado.
- O checkout espera `hydrated`, que só vira verdadeiro depois de carregar perfil e sessões. Assim, uma consulta lenta ou que não conclui impede tanto a abertura automática quanto o clique no card, mesmo com a sessão já autenticada.

## O que será alterado

1. **Separar autenticação de hidratação do perfil**
   - Expor no contexto do jogador quando a verificação da sessão já terminou, sem depender do carregamento de perfil, histórico e papel de admin.
   - Manter a hidratação completa para as telas e informações que realmente precisam desses dados.

2. **Liberar o checkout assim que a sessão estiver confirmada**
   - O fluxo dos cards e a retomada pós-login usarão o estado da autenticação para decidir entre abrir o Mercado Pago ou enviar para `/auth`.
   - O carregamento de perfil não bloqueará mais a compra de um usuário já logado.

3. **Preservar a intenção do plano**
   - Manter o plano escolhido durante login e abrir o checkout automaticamente ao voltar.
   - Se o usuário clicar novamente em Mensal, Semestral ou Anual, abrir imediatamente o checkout com o plano correspondente, sem exigir um segundo CTA.

4. **Evitar carregamento infinito**
   - Garantir que a inicialização do contexto finalize mesmo quando perfil ou sessões retornarem erro, usando um estado seguro de não assinante e permitindo nova tentativa posterior.

## Validação

- Reproduzir o fluxo: selecionar plano → login → retorno à homepage → rolagem para Oferta → checkout Mercado Pago visível.
- Testar também a seleção de outro plano após o login e confirmar que o valor/formulário muda sem travar.
- Confirmar que assinantes continuam sendo enviados ao app e visitantes continuam sendo enviados ao login.
