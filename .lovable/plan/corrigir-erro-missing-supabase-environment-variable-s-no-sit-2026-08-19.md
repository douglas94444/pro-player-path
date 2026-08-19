# Corrigir erro "Missing Supabase environment variable(s)" no site publicado

## Diagnóstico (verificado)

- O erro aparece no bundle do site publicado (`ballstar-trainer.lovable.app`), não no código-fonte.
- No arquivo publicado `assets/client-CixM3k4L.js`, o trecho do cliente Supabase ficou como `{}.VITE_SUPABASE_URL || {}.SUPABASE_URL` — ou seja, a última publicação foi construída **sem** as variáveis de ambiente do Supabase injetadas. Nenhuma URL do projeto (`zuqjyxcjftrtrhqxuvfq.supabase.co`) está embutida no bundle.
- No ambiente de desenvolvimento o `.env` está completo (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`), e a home local responde 200.
- Consequência em cadeia: o `player-store` instancia o cliente Supabase no primeiro render, ele lança a exceção e a tela quebra; o 403 vem de chamadas feitas sem chave válida.

Conclusão: é um problema de vínculo de ambiente/publicação, não uma falha de lógica da aplicação.

## Passos

1. Reatar as variáveis de ambiente do Supabase do projeto (refazer o binding `SUPABASE_URL` / chave publicável / service role) para garantir que o build de produção receba os valores.
2. Reiniciar o servidor de desenvolvimento e confirmar que a home carrega sem erro de Supabase.
3. Republicar o site e validar no domínio publicado que:
   - o novo bundle contém a URL real do projeto Supabase,
   - o console não mostra mais "Missing Supabase environment variable(s)",
   - login e seleção de plano/checkout funcionam.

## Proteção extra (opcional, recomendado)

Tornar a falha não fatal para a interface: em vez de o `player-store` derrubar a árvore React quando o cliente Supabase não puder ser criado, exibir um estado degradado (landing page continua visível, com aviso apenas nas ações que exigem login). Assim, uma publicação com ambiente incompleto no futuro não deixa a página em branco.

## Detalhes técnicos

- Arquivo envolvido: `src/integrations/supabase/client.ts` (gerado, lança erro quando as variáveis faltam) e `src/lib/player-store.tsx` (primeiro consumidor no render).
- Nenhuma migração de banco e nenhuma alteração de RLS são necessárias.
