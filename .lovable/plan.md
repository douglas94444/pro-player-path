# Corrigir definitivamente o Supabase no site publicado

## Diagnóstico confirmado

- O domínio publicado `ballstar-trainer.lovable.app` ainda referencia o bundle antigo `client-CixM3k4L.js` citado no erro.
- Esse bundle contém a mensagem de variáveis ausentes e não contém a URL do projeto Supabase.
- O preview atual usa bundles diferentes e não contém esse erro, indicando que a correção ainda não chegou à publicação em produção.

## Passos

1. Revalidar o vínculo das variáveis do Supabase com o ambiente de build para evitar uma nova publicação sem configuração.
2. Publicar uma nova versão do frontend, substituindo os artefatos antigos em produção.
3. Validar diretamente no domínio publicado que:
   - o HTML não referencia mais `client-CixM3k4L.js`;
   - o novo módulo do cliente contém a URL correta do projeto Supabase;
   - a página abre sem `Missing Supabase environment variable(s)` ou `Supabase indisponível`;
   - uma chamada pública ao Supabase deixa de retornar erro por chave ausente.

## Escopo técnico

- Não requer migração, alteração de RLS ou mudança no banco.
- Não requer nova alteração no cliente Supabase: o código já lê as variáveis corretas; o problema confirmado está no artefato antigo ainda publicado.