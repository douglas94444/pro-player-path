# Corrigir Supabase e liberar as formas de pagamento em produção

## Diagnóstico confirmado

- O domínio publicado ainda entrega `index-BpX_Xw7h.js`, que carrega o bundle antigo `client-CixM3k4L.js` citado no erro.
- Esse artefato publicado não contém a URL do projeto Supabase; por isso autenticação e leitura do perfil falham antes de o checkout conseguir avançar.
- O texto do print, “Preparando Pix e cartão…”, é renderizado por `CheckoutOferta` antes de `MercadoPagoCheckout` ser montado. No código atual, a abertura automática ainda depende de `hydrated`, apesar de a sessão já poder estar confirmada.
- O código atual já possui tratamento específico para carregar a chave publicável do Mercado Pago pelo backend e mostrar erro/tentativa novamente; essa versão ainda não está no bundle publicado.

## Implementação

1. **Tornar a configuração pública do Supabase resiliente**
   - Manter o uso normal das variáveis `VITE_SUPABASE_*`.
   - Adicionar fallback explícito somente para a URL e a chave anon/publicável deste projeto, que não são segredos, evitando que uma falha de injeção no build derrube autenticação e checkout novamente.
   - Preservar a chave de serviço exclusivamente no backend.

2. **Destravar a montagem do Mercado Pago**
   - Remover `hydrated` da condição de abertura automática do checkout.
   - Abrir o Payment Brick assim que a autenticação estiver resolvida, o usuário estiver logado e CPF/telefone tiverem sido carregados e validados.
   - Garantir que a consulta dos documentos sempre finalize em sucesso ou fallback, sem deixar “Preparando Pix e cartão…” indefinidamente.

3. **Validar a configuração do Mercado Pago**
   - Confirmar que a função pública retorna apenas a chave publicável `MERCADOPAGO_PUBLIC_KEY` já cadastrada.
   - Confirmar que o SDK chega aos estados de carregamento, formulário Pix/cartão ou erro recuperável — nunca ao spinner infinito.

4. **Testar e publicar o artefato correto**
   - Executar os testes focados em autenticação, checkout e cabeçalhos de segurança.
   - Validar no preview o carregamento do formulário e a ausência do erro do Supabase.
   - Fazer nova publicação e conferir diretamente em `ballstar-trainer.lovable.app` que o HTML não referencia mais `index-BpX_Xw7h.js`/`client-CixM3k4L.js` e que Pix/cartão aparecem.

## Escopo técnico

- Não requer alteração no banco, RLS ou dados existentes.
- Não expõe Access Token do Mercado Pago nem chave de serviço do Supabase.
- A chave anon do Supabase e a chave pública do Mercado Pago continuam tratadas como valores publicáveis; credenciais privadas permanecem somente no servidor.
