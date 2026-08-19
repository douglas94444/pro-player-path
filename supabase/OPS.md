# Ops Supabase — Jogador PRO

Checklist de operação (secrets + crons).

## Secrets

As Edge Functions leem **primeiro** o env do Dashboard e, se vazio, o **Vault** via RPC `vault_secret` (só `service_role`):

| Nome no Dashboard | Nome no Vault | Uso |
|-------------------|---------------|-----|
| `CRON_SECRET` | `cron_secret` | `send-winback`, `send-streak-reminder`, `send-checkout-recovery` + jobs `pg_net` |
| `MERCADOPAGO_WEBHOOK_SECRET` | `mercadopago_webhook_secret` | HMAC `x-signature` do webhook MP |

`cron_secret` já está no Vault. Os crons funcionam mesmo sem o secret no Dashboard.

Webhook MP: copie o secret em Your integrations → Webhooks e grave no Vault (substitui o valor de QA, se houver):

```sql
select vault.create_secret('COLE_O_SECRET_DO_MP', 'mercadopago_webhook_secret');
-- se o nome já existir:
-- select vault.update_secret(id, 'NOVO_VALOR') from vault.secrets where name = 'mercadopago_webhook_secret';
```

Sem `mercadopago_webhook_secret` (Vault) nem `MERCADOPAGO_WEBHOOK_SECRET` (Dashboard) o webhook responde 401.

Outros secrets só no Dashboard → Edge Functions → Secrets:

| Secret | Obrigatório | Uso |
|--------|-------------|-----|
| `MERCADOPAGO_ACCESS_TOKEN` | sim | `process-payment`, `mercadopago-webhook` |
| `ADMIN_EMAILS` | sim | `ensure-admin-role` |
| `META_CAPI_ACCESS_TOKEN` | sim (ads) | CAPI |
| `META_PIXEL_ID` | opcional | default `3161156880941929` |
| `RESEND_API_KEY` | sim (retenção) | e-mails |
| `RESEND_FROM` | sim | remetente |
| `APP_URL` | sim | links nos e-mails |

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` já são injetados.

## Crons (pg_cron + pg_net)

1. `send-checkout-recovery-hourly` — `5 * * * *`
2. `send-streak-reminder-daily` — `0 23 * * *` (BRT ~20h)
3. `send-winback-daily` — `10 23 * * *`
4. `expire-pro-access-hourly` — SQL já existente

Header: `Authorization: Bearer <cron_secret do Vault>`.

## Webhook Mercado Pago

`https://zuqjyxcjftrtrhqxuvfq.supabase.co/functions/v1/mercadopago-webhook`

## Cupons seed

- `PRO10` → 10%
- `AMIGO15` → 15%
