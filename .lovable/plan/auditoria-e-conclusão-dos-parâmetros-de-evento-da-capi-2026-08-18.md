# Auditoria e conclusão dos parâmetros de evento da CAPI

## O que já está correto

Confirmado no código atual (`supabase/functions/meta-capi`, `process-payment`, `mercadopago-webhook`, `src/lib/meta-pixel.ts`):

- `event_name`, `event_time`, `event_id`, `action_source: "website"`, `event_source_url`, `referrer_url`, `user_data` (em, ph, external_id, fbp, fbc, IP, user agent), `custom_data` (currency, value, content_name, utm, cupom) e `test_event_code`.

## Lacunas encontradas

1. **Eventos que só vão pelo Pixel do navegador** — usam `trackMeta` e nunca chegam à CAPI:
   - `ViewContent` (landing), `InitiateCheckout` (checkout), `CompleteRegistration` (cadastro), `Purchase` e `Subscribe` (retorno do Mercado Pago no cliente).
   Sem cópia server-side, esses eventos somem quando o navegador bloqueia o Pixel.
2. **`event_time` é o horário em que o servidor recebeu**, não o horário real da ação. Em Pix confirmado por webhook horas depois, o evento fica com a hora errada.
3. **`opt_out` não existe** — não há como marcar um evento como "só atribuição".
4. **`customer_segmentation` não é enviado** — a Meta não sabe distinguir primeira compra de renovação.
5. **`original_event_data` não é enviado** no Purchase do webhook, que é justamente o caso de evento atrasado que a doc recomenda cobrir.
6. **Deduplicação parcial**: `Subscribe` usa `${eventId}-sub`, correto; mas o `Purchase` do cliente e o do `process-payment` compartilham `mp-<id>`, o que está certo — só falta o `Subscribe` também ter par server-side.
7. **Data Processing Options (LDU)** só se aplica aos EUA; o público é Brasil, então fica de fora deliberadamente (enviaremos array vazio para deixar explícito).

## O que será feito

### 1. Todos os eventos do site passam pela CAPI
Trocar as chamadas `trackMeta` por `trackMetaDedup` em:
- `src/components/LandingPage.tsx` — `ViewContent`
- `src/components/CheckoutOferta.tsx` — `InitiateCheckout`
- `src/routes/auth.tsx` — `CompleteRegistration`
- `src/components/MercadoPagoCheckout.tsx` — `Subscribe` (o `Purchase` continua espelhado pelo backend com o mesmo `event_id`)

Cada um mantém o `event_id` atual para a Meta deduplicar.

### 2. `event_time` real
`meta-capi` passa a aceitar `event_time` do chamador (com validação: número, não futuro, no máximo 7 dias atrás; fora disso cai no `now()`). O webhook do Mercado Pago passa a usar `date_approved` do pagamento em vez da hora do webhook.

### 3. Novos campos suportados
Em `meta-capi/index.ts`:
- `opt_out` (booleano, repassado quando presente)
- `customer_segmentation` dentro de `custom_data`
- `original_event_data` (`event_name` + `event_time`) repassado quando presente
- `data_processing_options: []` explícito em todos os eventos

### 4. Segmentação de cliente nos eventos de compra
Em `process-payment` e no webhook, definir `customer_segmentation` como `new_customer_to_business` quando o perfil ainda não era assinante, e `existing_customer_to_business` em renovação/reativação (leitura do campo `assinante` antes da atualização).

### 5. `original_event_data` no webhook
O Purchase disparado pelo webhook (Pix/boleto confirmados depois) passa a incluir `original_event_data` com o nome e o horário do `InitiateCheckout` correspondente, gravado nos metadados do pagamento no `process-payment`.

## Detalhes técnicos

- Arquivos alterados: `supabase/functions/meta-capi/index.ts`, `supabase/functions/process-payment/index.ts`, `supabase/functions/mercadopago-webhook/index.ts`, `src/lib/meta-pixel.ts` (aceitar `eventTime`, `optOut`, `customerSegmentation`), `src/components/LandingPage.tsx`, `src/components/CheckoutOferta.tsx`, `src/components/MercadoPagoCheckout.tsx`, `src/routes/auth.tsx`.
- Nenhuma mudança de banco de dados; os metadados extras vão no campo `metadata` do pagamento no Mercado Pago.
- Tracking nunca deve quebrar a UI: todas as chamadas continuam em `void`/`catch` silencioso.
- Validação: `tsgo` + verificação dos eventos no Gerenciador de Eventos com `META_TEST_EVENT_CODE`.
