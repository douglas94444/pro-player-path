# Corrigir cadastro lento e checkout que não abre

## O que eu confirmei

- A conta `teste@teste.com` foi criada e confirmada às 14:24 (confirmação de e-mail está desligada, login é imediato) — o cadastro funciona, mas o app demora a liberar a tela.
- Depois do cadastro o app manda para `/planos`, que é só um redirecionador: ele reencaminha para a homepage `/` com `checkout=1`. Por isso você "cai na homepage".
- Na homepage, clicar num card de plano dispara um evento com `iniciar: false`, e o componente de checkout trata esse evento **fechando** o formulário de pagamento. Ou seja: clicar no card nunca abre o checkout — e se ele já tinha aberto sozinho, o clique fecha.
- O único jeito atual de abrir o pagamento é o botão verde grande abaixo dos cards.

## O que vou mudar

1. **Card de plano abre o checkout**
   Clicar (ou teclar Enter) em Mensal / Semestral / Anual passa a selecionar o plano **e** abrir o formulário de pagamento, rolando até ele. Nunca mais fechar o checkout já aberto ao trocar de plano — trocar de card apenas troca o valor cobrado.

2. **Abertura automática pós-cadastro mais confiável**
   Depois de criar a conta ou entrar, ir direto para a homepage com o checkout marcado para abrir (sem o salto extra por `/planos`), esperar o perfil carregar e então abrir o formulário e rolar até a seção Oferta.

3. **Cadastro mais rápido**
   Hoje, logo após o login, o app espera uma chamada de verificação de papel de admin antes de buscar o perfil e as sessões. Vou tornar essa verificação não bloqueante e paralela, para a tela liberar assim que o perfil chegar.

4. **Estado de carregamento visível**
   Enquanto o perfil carrega após o cadastro, mostrar o botão de checkout em estado "carregando" em vez de parecer travado.

## Detalhes técnicos

- `src/components/landing/PlanosTable.tsx`: `selecionar()` passa a despachar `CHECKOUT_EVENT` com `iniciar: true`.
- `src/components/CheckoutOferta.tsx`: no handler do evento, `iniciar: false` só troca o plano (remover `setMostrarBrick(false)`); `iniciar: true` mantém o fluxo atual (login → `/auth`, assinante → `/app`). O auto-open (`abrirAoMontar`) passa a aguardar a hidratação do `usePlayer` antes de decidir.
- `src/routes/auth.tsx`: em `from === "planos"`, navegar direto para `/` com `{ from: "auth", plano, checkout: "1" }` em vez de `/planos` (a rota `/planos` continua existindo como redirect para links antigos).
- `src/lib/player-store.tsx`: `ensureAdminRole()` sai do `await` sequencial e roda em paralelo/em background, atualizando o `role` quando responder.

## Observação sobre o teste de pagamento

Com o Mercado Pago, e-mails como `teste@teste.com` costumam ser recusados no pagamento real. Para testar ponta a ponta use as credenciais de teste do MP (cartão de teste + e-mail de comprador de teste da sua conta) ou um e-mail real seu. Depois de aplicar as correções acima eu peço para você repetir o teste e, se o pagamento falhar, eu leio os logs da função `process-payment` para ver a resposta exata do Mercado Pago.
