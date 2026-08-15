# Auditoria de segurança — resultados e correções propostas

Revisei o código atual nos 5 pontos pedidos. Resumo do que está OK e o que precisa de correção.

## 1. Injeção de SQL — OK, sem ação

Nenhuma consulta monta SQL por concatenação de texto. Todo acesso a dados passa pelo cliente Supabase (`.from().select()/.insert()/.update()`), que envia os valores como parâmetros, e as regras de acesso por linha (RLS) limitam o que cada usuário enxerga. As únicas funções chamadas por RPC são `is_admin()`, sem argumentos vindos do usuário.

## 2. XSS — 1 ponto real a corrigir

- Todo texto de usuário (nome, sugestões, mensagens) é renderizado por React, que escapa HTML automaticamente. Não há uso de HTML bruto para conteúdo de usuário.
- Os dois usos de HTML bruto existentes são o script do Meta Pixel (valor fixo do código) e o componente de gráfico da biblioteca de UI — ambos sem entrada de usuário.
- **Falha encontrada:** o link de vídeo salvo pelo admin (`salvarLinkVideo`) é gravado sem validação e depois usado direto como `src` de `<iframe>`/`<video>` e como `href` no painel. Um endereço `javascript:` ou `data:` ali vira execução de código.
  - **Correção:** validar o endereço no momento de salvar e novamente na hora de exibir — aceitar apenas `https:` e apenas domínios da lista (`youtube.com`, `youtu.be`, `vimeo.com`, o domínio do Storage do Supabase). Qualquer outro valor é recusado com mensagem clara.

## 3. CSRF — OK, sem ação

O projeto já registra a proteção contra requisições de outros sites (`createCsrfMiddleware` em `src/start.ts`) para todas as funções de servidor, e a autenticação viaja num cabeçalho `Authorization` (não em cookie), o que por si só já impede o ataque clássico. Nenhuma ação necessária.

## 4. Validação de entrada — parcialmente OK

- Já validado no servidor: sugestões (nome, e-mail, tipo, tamanho da mensagem via Zod) e conclusão de treino (id do treino, chave do plano, assinatura ativa, minutos definidos pelo servidor).
- **Falhas encontradas:**
  1. `enviarSugestaoAnonima` é um endpoint público sem qualquer limite — dá para inundar a tabela de sugestões. **Correção:** limite por IP/e-mail (ex.: 5 envios por hora), com o contador guardado no banco e verificado no servidor.
  2. O envio de link/arquivo de vídeo não valida nada no servidor: hoje a checagem de tipo e tamanho acontece só no navegador, e o link não é validado em lugar nenhum. **Correção:** mover essa gravação para uma função de servidor que confirma que quem chama é admin, valida o endereço (item 2) e valida o tipo/tamanho declarados.
  3. Os limites do bucket de vídeos (tamanho máximo e formatos aceitos) continuam pendentes de configuração no painel do Supabase — sem isso, um admin comprometido pode subir qualquer arquivo.

## 5. Cabeçalhos de segurança — ausentes, corrigir

Hoje a aplicação não envia `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` nem `Strict-Transport-Security`.

**Correção:** adicionar um middleware de resposta em `src/start.ts` que aplica em todas as páginas:

- `Content-Security-Policy` liberando apenas o necessário: scripts próprios + Meta Pixel, imagens do Facebook e do Supabase, conexões ao Supabase e à Graph API, `frame-src` limitado a YouTube/Vimeo, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`.
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` desativando câmera/microfone/geolocalização e `Strict-Transport-Security`.

Observação: o script inline do Meta Pixel exige um `nonce` na política; o middleware gera esse nonce por requisição e o repassa ao script no `__root`, evitando o uso de `unsafe-inline`.

## Item extra encontrado (fora da lista, mas relevante)

As funções de borda `meta-capi` e `process-payment` respondem com `Access-Control-Allow-Origin: *`. Para `meta-capi`, que é pública, isso permite que qualquer site dispare eventos falsos de conversão. **Correção sugerida:** restringir a origem permitida aos domínios do projeto.

## Ordem de execução

1. Cabeçalhos de segurança + nonce do Pixel (`src/start.ts`, `src/routes/__root.tsx`).
2. Validação/allowlist de endereços de vídeo (`src/lib/treino-videos.ts`, `src/components/ExerciseDemo.tsx`, `src/routes/admin.videos.tsx`).
3. Função de servidor com checagem de admin para salvar vídeos (novo `src/lib/treino-videos.functions.ts`).
4. Limite de envios do formulário público de sugestões (migração + validação no servidor).
5. Restringir CORS da função `meta-capi`.

## Detalhes técnicos

- Middleware de resposta via `createMiddleware().server()` adicionado a `requestMiddleware` no `createStart`, preservando `errorMiddleware` e `csrfMiddleware` já existentes.
- Allowlist de vídeo implementada como função pura reutilizada no cliente e no servidor.
- Rate limit: tabela `sugestoes_rate_limit` (chave = hash do IP + janela de tempo) com GRANTs e RLS, escrita apenas pelo service role dentro da função de servidor.
- Nenhuma alteração no fluxo de pagamento ou nas regras de RLS existentes.
