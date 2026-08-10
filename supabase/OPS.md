# Ops Supabase — Jogador PRO

Checklist para fechar o gap de operação (secrets + crons).

## Secrets (Dashboard → Edge Functions → Secrets)

| Secret | Obrigatório | Uso |
|--------|-------------|-----|
| `MERCADOPAGO_ACCESS_TOKEN` | sim | `process-payment`, `mercadopago-webhook` |
| `ADMIN_EMAILS` | sim | `ensure-admin-role` (lista separada por vírgula) |
| `META_CAPI_ACCESS_TOKEN` | sim (ads) | CAPI em `process-payment` / `meta-capi` |
| `META_PIXEL_ID` | opcional | default `3161156880941929` |
| `RESEND_API_KEY` | sim (retenção) | `send-streak-reminder`, `send-winback` |
| `RESEND_FROM` | sim | ex. `Jogador PRO <onboarding@seudominio.com>` |
| `APP_URL` | sim | links nos e-mails |

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` já são injetados.

## Frontend (.env)

```
VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-...
VITE_TELEGRAM_PRO_URL=https://t.me/seu_grupo_pro
VITE_WHATSAPP_SUPPORT=https://wa.me/55...
```

## Crons (Dashboard → Edge Functions → Schedules)

`pg_cron` e `pg_net` já estão habilitados no projeto.

Agende diário (BRT ~20h = 23:00 UTC) no Dashboard **ou** via SQL com a service role no header:

1. `send-streak-reminder` — lembrete de streak
2. `send-winback` — D3/D7 pós-cancel

```sql
-- Exemplo (troque YOUR_SERVICE_ROLE_KEY):
select cron.schedule(
  'send-streak-reminder-daily',
  '0 23 * * *',
  $$select net.http_post(
    url := 'https://zuqjyxcjftrtrhqxuvfq.supabase.co/functions/v1/send-streak-reminder',
    headers := '{"Authorization":"Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  );$$
);
```

## Webhook Mercado Pago

`https://zuqjyxcjftrtrhqxuvfq.supabase.co/functions/v1/mercadopago-webhook`

## Cupons seed

- `PRO10` → 10%
- `AMIGO15` → 15%

Criar mais em SQL:

```sql
insert into coupons (code, discount_percent, affiliate_code)
values ('JP-ABCD1234', 10, 'jp-abcd1234');
```

No checkout, `?ref=` tenta auto-aplicar cupom com `code` ou `affiliate_code` igual ao ref.
