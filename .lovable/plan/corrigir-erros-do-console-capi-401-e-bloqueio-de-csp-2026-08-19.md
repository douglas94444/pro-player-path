# Corrigir erros do console: CAPI 401 e bloqueio de CSP

O log enviado mostra dois problemas reais em produção (`ballstar-trainer.lovable.app`), ambos ligados ao rastreamento da Meta. Nenhum quebra a compra, mas os dois degradam a qualidade dos eventos de anúncio.

## Problema 1 — eventos server-side falhando com 401

`POST .../functions/v1/meta-capi 401 (Unauthorized)`

A função exige um usuário autenticado (ou um segredo compartilhado) para aceitar o evento. Visitantes não logados — justamente quem gera `PageView`, `ViewContent` e `InitiateCheckout` no topo do funil — não têm sessão, então a chamada é rejeitada e o evento só chega pelo Pixel do navegador (perde eventos de quem usa bloqueador).

Correção: permitir chamadas anônimas na função, mantendo a proteção que já existe:
- lista de origens permitidas (já implementada) continua sendo o filtro principal;
- lista de eventos permitidos continua válida;
- eventos com valor monetário (`Purchase`, `Subscribe`) permanecem restritos a chamador autenticado/segredo, já que a compra real é confirmada no servidor pelo webhook do Mercado Pago;
- demais eventos de funil passam a ser aceitos sem sessão.

## Problema 2 — CSP bloqueando o endpoint de medição da Meta

`Refused to connect ... https://md-<id>.ecs.us-east-2.on.aws/events` (6 ocorrências)

É o canal de entrega de sinais do Pixel novo. O `connect-src` atual não inclui esse host, então cada envio é bloqueado e polui o console.

Correção: adicionar `https://*.ecs.us-east-2.on.aws` ao `connect-src` em `src/lib/security-headers.ts`. Escopo estreito, sem afrouxar `script-src`.

## Detalhes técnicos

- `supabase/functions/meta-capi/index.ts`: `authorizeCaller` passa a retornar um nível de confiança (`anon` | `auth`) em vez de booleano; eventos de valor exigem `auth`.
- `src/lib/security-headers.ts`: novo host no `connect-src`; ajustar `src/lib/security-headers.test.ts` se ele fixar a string da política.
- Sem mudanças de UI, dados ou fluxo de pagamento.

## Verificação

- Recarregar a home deslogado: nenhum 401 de `meta-capi` e nenhum bloqueio de CSP no console.
- Confirmar que os eventos continuam chegando com `event_id` deduplicado.
