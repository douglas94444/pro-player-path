# Auditoria dos 20 problemas — o que já foi corrigido e o que falta

Fiz a verificação item a item no código atual e no banco. Resumo: **12 já resolvidos, 3 parcialmente, 5 ainda abertos.**

## Já corrigidos (verificados)

| # | Situação |
|---|---|
| P1 | Não existe mais `activateLocalPlan`. Após aprovação, o app só chama `refreshEntitlement()` (lê o banco) antes de liberar PRO. |
| P2 | O `?ref=` não é mais interpolado em filtro `.or()`; usa `.eq()` separados, e o cupom digitado passa por validação de formato antes da consulta. |
| P3 | O snippet base do Pixel não dispara `PageView`; só o componente dispara, uma vez por rota. |
| P5 | `Purchase` sai com o mesmo `event_id` (`mp-<id do pagamento>`) no navegador e na API de conversões — o Meta deduplica. |
| P6 | Biblioteca tem campo de busca textual e ordenação (duração, intensidade, popularidade). |
| P8 | Streak/datas usam helpers de fuso de Brasília (`hojeBR`, `inicioSemanaBR`, `horaBR`) no app e no servidor de conclusão de treino. |
| P9 | O treino salva índice do exercício e tempo em `sessionStorage` e retoma após F5. |
| P10 | Escritas passam por `safeWrite`, com fila de repetição local e aviso de offline; conclusão de treino é validada no servidor. |
| P11 | A política do ranking foi trocada por "cada um lê a própria linha"; o ranking público sai de uma view anonimizada. |
| P13 | Vídeos têm skeleton de carregamento e estado "Vídeo em breve" quando não há mídia ou o link falha. |
| P15 | O reset de progresso em /perfil exige um segundo clique de confirmação. |
| P7 | Modo Rápido deixou de ser aleatório: é determinístico, considera objetivo/histórico e prioriza o treino mais curto. |

## Parcialmente resolvidos

- **P4 — InitiateCheckout:** ainda existem dois pontos de disparo na home (clique no botão e retomada pós-login), com código duplicado. Não dispara duas vezes no mesmo clique, mas o risco existe se o efeito reexecutar.
- **P12 — telas de erro:** todas as rotas têm `errorComponent`/`notFoundComponent`, **exceto** `admin` e `planos`.
- **P17 — vídeos órfãos:** a troca de vídeo apaga o arquivo anterior, mas a falha ao apagar continua ignorada e o bucket não tem limite de tamanho nem tipos permitidos no servidor.

## Ainda abertos

- **P14 — segurança do banco:** o linter aponta 3 itens: proteção contra senha vazada desativada, uma view com `SECURITY DEFINER` e uma função `SECURITY DEFINER` executável por qualquer usuário logado.
- **P16 — cadastro:** só há `minLength=6`, sem medidor de força de senha nem mensagem específica para e-mail já cadastrado.
- **P18 — "Douglas" hardcoded:** a lógica de dev continua em `player-store` (dois pontos) e apaga o nome de qualquer usuário chamado Douglas.
- **P19 — acessibilidade:** falta `aria-label` na maioria dos botões só-ícone, `role="timer"` + `aria-live` no contador do treino, skip-link e ajuste de contraste do verde em textos pequenos.
- **P20 — og:image:** nenhuma rota pública (`/`, `/campanha`, `/planos`) tem imagem de compartilhamento.

## Plano de correção proposto

1. **P14 (alta):** ativar proteção contra senha vazada no Auth; recriar a view do ranking como `security_invoker` e revogar `EXECUTE` público da função `SECURITY DEFINER` que não precisa ser chamada por usuários logados (mantendo `is_admin`, usada nas políticas).
2. **P12:** adicionar `errorComponent`/`notFoundComponent` em `admin` e `planos`.
3. **P4:** extrair um único disparo de `InitiateCheckout` com guarda para não repetir na mesma sessão de checkout.
4. **P18:** remover as comparações com "Douglas" e tratar apenas o placeholder "Jogador".
5. **P20:** gerar uma imagem de compartilhamento e apontar `og:image`/`twitter:image` (URL absoluta) nas três rotas públicas.
6. **P19:** `aria-label` nos botões só-ícone, `role="timer"` + `aria-live="polite"` no contador, skip-link no layout e reforço de contraste do verde em textos pequenos.
7. **P16:** medidor de força de senha no cadastro e mensagem dedicada quando o e-mail já existe.
8. **P17:** aplicar limite de tamanho e tipos MIME no bucket, e tratar/registrar falha ao apagar arquivo antigo em vez de ignorar.

### Detalhes técnicos

- P14 exige uma migração (`ALTER VIEW ... SET (security_invoker = on)`, `REVOKE EXECUTE ... FROM authenticated`) e a ativação do "leaked password protection" nas configurações de Auth.
- P17 usa atualização de bucket (`file_size_limit`, `allowed_mime_types`) além da validação já existente no cliente.
- Nenhum item exige mudança de modelo de dados ou nova tabela.
