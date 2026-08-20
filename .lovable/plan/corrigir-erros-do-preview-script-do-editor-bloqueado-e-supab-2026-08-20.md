# Corrigir erros do preview: script do editor bloqueado e Supabase sem variáveis

## O que está acontecendo (verificado)

1. **CSP bloqueia o script do editor Lovable** (`https://cdn.gpteng.co/lovable.js`). Nossa política em `src/lib/security-headers.ts` não inclui esse host em `script-src`, então o preview do editor perde recursos de inspeção/seleção.
2. **Bundle publicado sem as variáveis do Supabase.** No ambiente de desenvolvimento o `.env` está completo (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`), mas o build servido em `preview--ballstar-trainer.lovable.app` foi gerado sem elas — daí o erro "Missing Supabase environment variable(s)" repetido e o `[auth] Supabase indisponível` no `player-store`.

## Correções

1. **Liberar o script do editor apenas nos hosts de preview**
   - Em `src/lib/security-headers.ts`, quando o host for de preview Lovable, adicionar `https://cdn.gpteng.co` a `script-src` (e manter a produção estrita, sem esse host).
   - Ajustar `src/lib/security-headers.test.ts` para cobrir os dois casos (preview permite, produção não).

2. **Reatar o ambiente do Supabase e republicar**
   - Refazer o vínculo das variáveis do Supabase do projeto para que o build de produção/preview receba os valores.
   - Republicar e confirmar no bundle publicado que a URL real do projeto aparece e que o console não mostra mais o erro.

3. **Não derrubar a interface quando faltar configuração (proteção extra)**
   - O `useAuth` já trata a falha; garantir que o `player-store` também siga em modo visitante em vez de repetir o erro em cada render, evitando a enxurrada de mensagens no console.

## Verificação

- Preview do editor: nenhum bloqueio de CSP para `cdn.gpteng.co`.
- Site publicado deslogado: sem "Missing Supabase environment variable(s)", login e checkout funcionando.

## Detalhes técnicos

- Arquivos: `src/lib/security-headers.ts`, `src/lib/security-headers.test.ts`, `src/lib/player-store.tsx`.
- Sem migração de banco e sem alteração de RLS.
