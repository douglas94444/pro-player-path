# Corrigir exibição das formas de pagamento

## Objetivo
Fazer Pix e cartão aparecerem automaticamente na etapa de pagamento, sem exigir um segundo clique confuso, e garantir que o SDK do Mercado Pago tenha a configuração necessária para renderizar.

## Implementação
1. **Abrir o checkout automaticamente**
   - Na rota `/checkout`, montar o Payment Brick assim que autenticação, CPF e telefone estiverem prontos.
   - Manter o formulário de dados pessoais antes do pagamento quando houver informação pendente.
   - Remover o estado intermediário que mostra apenas “O Mercado Pago abre ao finalizar o pedido” quando o usuário já pode pagar.

2. **Tratar o carregamento do Mercado Pago**
   - Exibir um carregamento claro enquanto Pix e cartão são buscados.
   - Se o SDK falhar ou a configuração estiver ausente, mostrar uma mensagem amigável com ação para tentar novamente, sem expor nomes técnicos de variáveis ao cliente.
   - Preservar Pix, cartão, parcelamento, idempotência e o fluxo de aprovação já existentes.

3. **Corrigir a configuração da chave pública**
   - Garantir que `VITE_MERCADOPAGO_PUBLIC_KEY` esteja vinculada ao frontend no preview e na publicação; o ambiente atual não contém essa chave, embora o token privado do backend esteja presente.
   - Não mover o Access Token privado para o frontend.

4. **Validar o fluxo completo**
   - Testar usuário logado e usuário que precisa completar os dados.
   - Confirmar que o bloco do Mercado Pago renderiza as opções Pix e cartão e que a troca de plano atualiza o valor sem ocultar o formulário.
   - Verificar o comportamento em desktop e mobile.

## Resultado esperado
Ao chegar ao checkout com os dados obrigatórios preenchidos, o usuário vê imediatamente as formas de pagamento do Mercado Pago, em vez do cartão informativo mostrado no print.