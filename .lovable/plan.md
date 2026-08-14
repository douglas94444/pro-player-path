# Plano: formulário de sugestões de melhoria

Adicionar um canal para usuários enviarem sugestões, bugs e elogios sobre a plataforma, com leitura no painel admin.

## O que será entregue

1. **Tabela `sugestoes`** no Supabase para armazenar o envio.
   - `id` uuid PK, `user_id` uuid nullable, `email` text, `nome` text, `tipo` text, `mensagem` text, `created_at`.
   - RLS: qualquer pessoa (anon ou authenticated) pode inserir; apenas admins podem ler.
2. **Server function `enviarSugestao`** em `src/lib/sugestoes.functions.ts`.
   - Validação com Zod (tipo, mensagem, email e nome com limites de tamanho).
   - Registra `user_id` quando o usuário está logado.
3. **Formulário na página `/perfil`**.
   - Seletor de tipo: Sugestão, Bug, Elogio.
   - Campo de mensagem.
   - Usa email/nome do perfil quando logado; pede email/nome quando visitante.
   - Feedback com `sonner` após envio.
4. **Página admin `/admin/sugestoes`**.
   - Lista ordenada por data, mostrando tipo, nome/email, mensagem e data.
   - Link no `AdminShell` para acessar.

## Design/UX

- Usar os mesmos cards arredondados (`rounded-[1.5rem]`) e sombras do restante do app.
- Manter a estética light-soft já existente.
- Formulário acessível com labels e estados de loading.

## Tarefas

1. Migration Supabase para criar tabela `sugestoes` com RLS e GRANTs.
2. Criar `src/lib/sugestoes.functions.ts` com `createServerFn`.
3. Adicionar seção de sugestões em `src/routes/perfil.tsx`.
4. Criar `src/routes/admin.sugestoes.tsx` e adicionar link no `AdminShell`.
5. Verificar build e tipos.
