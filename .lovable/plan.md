# Plano: ajustes finais pós-QA

Os três bugs críticos (paywall burlável, sessões forjadas e XP infinito) já foram corrigidos. Este plano cobre os itens restantes do relatório de QA.

## 1. Fuso horário do Brasil em todo o app

Hoje o app calcula "hoje" em UTC no navegador (`new Date().toISOString().slice(0,10)`), enquanto o servidor já grava a sessão em horário de São Paulo. Depois das 21h isso faz o treino aparecer no dia seguinte e pode zerar o fogo (streak) indevidamente.

- Criar um utilitário único de data (`hojeBR()` e `inicioSemanaBR()`) em `src/lib/date.ts`.
- Usar esse utilitário em: dashboard/streak (`player-store`), tela de treino, progresso, ranking e lembrete de streak.

Resultado: o dia do jogador vira à meia-noite de Brasília, igual ao servidor.

## 2. Cupom de afiliado: entrada sanitizada

O código de indicação que vem pela URL (`?ref=`) é hoje colado direto dentro de um filtro de busca no banco. Um link malicioso pode alterar a consulta.

- Validar o código com uma regra estrita (letras, números, hífen e sublinhado, até 40 caracteres) antes de qualquer consulta.
- Trocar o filtro combinado por duas consultas simples (por código do cupom e por código de afiliado).
- Aplicar a mesma validação ao campo de cupom digitado manualmente.

O valor final continua sendo calculado no servidor, então o desconto exibido não muda o que é cobrado.

## 3. Busca por texto na biblioteca

A biblioteca só tem filtros por categoria, posição e momento da temporada.

- Adicionar campo de busca no topo da lista, filtrando por título, descrição e nome dos exercícios.
- Manter combinação com os filtros existentes e mostrar estado vazio ("nenhum treino encontrado") com botão para limpar filtros.

## 4. Feedback ao concluir treino

Como a conclusão agora passa pelo servidor, o botão pode ficar alguns instantes sem resposta.

- Estado de carregando no botão "Concluir treino" (desabilitado + texto "Salvando…") para evitar duplo clique.
- Mensagem clara quando o servidor recusa (sem assinatura ativa ou treino já registrado hoje).

## Detalhes técnicos

- Novo módulo `src/lib/date.ts` com `Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" })`, espelhando a função já usada em `src/lib/treinos.functions.ts`.
- Arquivos tocados: `src/lib/player-store.tsx`, `src/lib/streak-reminder.ts`, `src/routes/progresso.tsx`, `src/routes/ranking.tsx`, `src/routes/treino.$treinoId.tsx`, `src/routes/planos.tsx`, `src/routes/biblioteca.tsx`.
- Sem mudanças no banco de dados nem em Edge Functions.
