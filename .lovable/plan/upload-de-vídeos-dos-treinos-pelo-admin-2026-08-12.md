# Upload de vídeos dos treinos pelo /admin

Sim, dá para subir de forma nativa: crio uma área de mídia no painel admin onde você arrasta o arquivo MP4 (ou cola um link do YouTube/Vimeo) e associa a um treino ou a um exercício. Os arquivos ficam no Storage do Supabase e aparecem automaticamente no player.

## O que você vai poder fazer

- Abrir `/admin/videos` e ver a lista de todos os treinos e seus exercícios.
- Em cada item: botão "Enviar vídeo" (upload MP4/WebM direto do computador, com barra de progresso) ou "Usar link" (YouTube/Vimeo/URL externa).
- Definir um **vídeo de capa do treino** (sessão completa) e **um vídeo por exercício**.
- Prévia do vídeo no próprio admin, trocar ou remover.
- Enquanto um exercício não tiver vídeo próprio, continua usando a demo genérica atual.

## Onde aparece para o aluno

- Tela do treino (`/treino/:id`): capa do treino no topo quando existir.
- Player de exercício: usa o vídeo cadastrado no lugar da animação/demo stock.

## Detalhes técnicos

- **Storage**: bucket `treinos-videos` (público, para leitura direta no player). Políticas: leitura pública; upload/atualização/remoção apenas para admin (`is_admin()`).
- **Tabela `public.treino_videos`**: `treino_id` (texto), `exercicio_nome` (texto, nulo = vídeo de capa do treino), `tipo` (`upload` | `link`), `url`, `storage_path`, `created_at`, `updated_at`, com índice único por (treino_id, exercicio_nome). GRANTs: `select` para `anon` e `authenticated`; escrita só via política de admin. RLS ligada.
- **Leitura no app**: hook que carrega o mapa de vídeos e faz merge com `src/data/training.ts` (vídeo cadastrado tem prioridade sobre `DEMO_VIDEOS`).
- **Upload**: feito no cliente com o SDK do Supabase Storage (usuário admin autenticado), com validação de tipo e limite de tamanho (sugestão: 200 MB por arquivo) e nome de arquivo normalizado.
- **Nova rota**: `src/routes/admin.videos.tsx`, adicionada ao menu do `AdminShell`.
- `ExerciseDemo` já suporta MP4 e YouTube; só ajusto o texto de placeholder e adiciono suporte a Vimeo.

## Observação sobre custo

Arquivos MP4 no Storage consomem armazenamento e banda a cada visualização. Para vídeos longos, o link do YouTube/Vimeo sai mais barato — por isso as duas opções ficam disponíveis lado a lado.
