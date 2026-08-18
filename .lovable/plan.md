# Melhorar a qualidade dos eventos da Conversions API (Meta)

Objetivo: elevar a "qualidade de correspondência de eventos" no Gerenciador de Anúncios, enviando os parâmetros recomendados pela documentação da Meta em todos os eventos server-side.

## O que está hoje

- O navegador dispara o Pixel e chama a função `meta-capi` com o mesmo `event_id` (deduplicação já funciona).
- A CAPI hoje envia: `em` (hash), `client_ip_address`, `client_user_agent`, `fbp`, `fbc`, `action_source`, `event_source_url`.
- O `fbc` só existe se o cookie `_fbc` já tiver sido criado pelo Pixel; quando o anúncio traz `?fbclid=` e o cookie ainda não existe, o parâmetro se perde.
- A compra aprovada (Mercado Pago) envia `Purchase` server-side apenas com o e-mail — sem `fbp`, `fbc`, `client_ip_address`, `client_user_agent` nem `event_source_url`, que são justamente os que mais pesam na atribuição.

## O que será feito

1. **Capturar e persistir o `fbclid`**
   - Ao carregar qualquer página com `?fbclid=`, montar o `fbc` no formato `fb.1.<timestamp>.<fbclid>` e guardar (cookie/localStorage) por 90 dias.
   - Usar esse valor como fallback quando o cookie `_fbp`/`_fbc` não existir.

2. **Enviar identificadores adicionais em todos os eventos**
   - `external_id`: ID do usuário logado (hash SHA-256), o que amarra eventos do mesmo usuário em diferentes dispositivos.
   - `referrer_url` e `event_source_url` sempre preenchidos.
   - Manter `client_user_agent` e `action_source: "website"` obrigatórios em eventos web.

3. **Purchase server-side completo**
   - Guardar `fbp`, `fbc`, user agent e URL de origem junto com os dados do pagamento no momento do checkout.
   - Ao aprovar o pagamento (tanto no fluxo direto quanto no webhook), enviar o `Purchase` com todos esses parâmetros + `em` + `external_id`, usando `event_id` estável (`mp-<id do pagamento>`) para deduplicar com o Pixel.

4. **Modo de teste**
   - Suporte opcional a `test_event_code` via variável de ambiente, para validar os eventos na aba "Testar eventos" do Gerenciador sem sujar os dados de produção.

5. **Normalização conforme a documentação**
   - E-mail em minúsculas e sem espaços antes do hash (já feito), telefone só com dígitos e DDI quando existir, e nunca hashear `fbp`, `fbc`, IP e user agent.

## Detalhes técnicos

- `src/lib/meta-pixel.ts`: helper `getFbc()` com fallback de `fbclid`, inclusão de `external_id` (hash via WebCrypto) e `referrer_url` no payload enviado à função.
- `supabase/functions/meta-capi/index.ts`: aceitar `external_id`, `referrer_url`, `test_event_code`; hashear `external_id` no servidor caso venha em texto puro.
- `supabase/functions/process-payment/index.ts` e `mercadopago-webhook/index.ts`: receber/ler os campos de atribuição (`fbp`, `fbc`, `client_user_agent`, `event_source_url`) e incluí-los no `Purchase`; persistir esses campos em `payment_events` para o webhook conseguir reconstruir o evento.
- `src/components/MercadoPagoCheckout.tsx`: enviar os campos de atribuição no corpo do pagamento.

## Fora de escopo

- Parâmetros de app (`madid`, `anon_id`, `extinfo`) — não há app nativo.
- Eventos offline/CRM e Click-to-WhatsApp.
