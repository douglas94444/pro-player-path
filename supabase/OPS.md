# Ops Supabase — Jogador PRO

Checklist para fechar o gap de operação (secrets + crons).

## Secrets (Dashboard → Edge Functions → Secrets)

| Secret | Obrigatório | Uso |
|--------|-------------|-----|
| `MERCADOPAGO_ACCESS_TOKEN` | sim | `process-payment`, `mercadopago-webhook` |
| `MERCADOPAGO_WEBHOOK_SECRET` | sim | HMAC `x-signature` do webhook MP |
| `CRON_SECRET` | sim | `send-winback`, `send-streak-reminder`, `send-checkout-recovery` |
| `ADMIN_EMAILS` | sim | `ensure-admin-role` (lista separada por vírgula) |
| `META_CAPI_ACCESS_TOKEN` | sim (ads) | CAPI em `process-payment` / `meta-capi` |
| `META_PIXEL_ID` | opcional | default `3161156880941929` |
| `RESEND_API_KEY` | sim (retenção) | e-mails de retenção |
| `RESEND_FROM` | sim | ex. `Jogador PRO <onboarding@seudominio.com>` |
| `APP_URL` | sim | links nos e-mails |

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` já são injetados.

O mesmo valor de `CRON_SECRET` precisa existir no Vault (os crons `pg_net` leem de lá):

```sql
select vault.create_secret('COLE_O_MESMO_CRON_SECRET', 'cron_secret');
```

Webhook Mercado Pago: em Your integrations → Webhooks, copie o secret e grave em `MERCADOPAGO_WEBHOOK_SECRET`. Sem isso o webhook responde 401.

## Frontend (.env)

```
VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-...
VITE_TELEGRAM_PRO_URL=https://t.me/seu_grupo_pro
VITE_WHATSAPP_SUPPORT=https://wa.me/55...
```

## Crons (pg_cron + pg_net)

`pg_cron` e `pg_net` já estão habilitados. A migration `20260819120000_p0_auth_rls_crons` agenda:

1. `send-checkout-recovery-hourly` — `5 * * * *` (45 min–24 h)
2. `send-streak-reminder-daily` — `0 23 * * *` (BRT ~20h)
3. `send-winback-daily` — `10 23 * * *`
4. `expire-pro-access-hourly` — SQL já existente

Header: `Authorization: Bearer <cron_secret do Vault>`. Sem o secret no Vault os jobs HTTP não sobem (NOTICE na migration).

## Webhook Mercado Pago

`https://zuqjyxcjftrtrhqxuvfq.supabase.co/functions/v1/mercadopago-webhook`

## Cupons seed

- `PRO10` → 10%
- `AMIGO15` → 15%

```sql
insert into coupons (code, discount_percent, affiliate_code)
values ('JP-ABCD1234', 10, 'jp-abcd1234');
```

No checkout, `?ref=` tenta auto-aplicar cupom com `code` ou `affiliate_code` igual ao ref.
