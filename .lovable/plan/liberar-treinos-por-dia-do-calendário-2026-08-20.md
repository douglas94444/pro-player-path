# Liberar treinos por dia do calendário

Hoje o plano libera o próximo dia assim que o anterior é concluído — dá para fazer 10 treinos numa tarde. A nova regra: **um dia do plano por data, sem pular a ordem**.

## Como vai funcionar

- **Dia 1** é liberado no primeiro dia da jornada (data em que o jogador começa).
- A cada novo dia em Brasília (00h), mais um dia do plano fica disponível.
- O jogador **só acessa o próximo dia depois de concluir os anteriores**. Se pulou um dia, ele fica pendente e é o próximo a ser feito — nada é perdido.
- Concluiu o treino de hoje? O próximo dia aparece bloqueado com **"Libera em Xh Ymin"**, contando até a meia-noite de Brasília.

Ou seja: quem está em dia faz 1 treino por dia; quem atrasou pode recuperar os dias pendentes (a liberação por data já está "adiantada" nesses casos).

## Marco inicial da jornada

O Dia 1 conta a partir da **data do primeiro treino concluído**. Enquanto o jogador não treinou nenhuma vez, o Dia 1 está liberado imediatamente. Assim ninguém perde dias por ter assinado e demorado a começar.

## O que muda nas telas

**/plano**
- Cada dia passa a ter 3 estados: concluído, disponível agora (com botão), ou bloqueado.
- Dias bloqueados por data mostram "Libera em Xh Ymin" (se for o próximo) ou "Libera no dia N da sua jornada".
- Dias bloqueados por ordem continuam como preview, sem link.
- Sem assinatura, tudo continua como preview com CTA para o checkout.

**/app (home)**
- Se o treino do dia já foi concluído, o card principal vira "Treino de hoje concluído" com a contagem para o próximo e atalhos para biblioteca e progresso, no lugar de "Começar agora".

**/treino/:id**
- Abrir por link direto um dia ainda não liberado mostra aviso e volta para o plano.

## Detalhes técnicos

- Novo módulo `src/lib/liberacao.ts`: `diasDesdeInicio(sessoes)`, `indiceLiberado(...)` e `proximaLiberacaoMs()`, usando `hojeBR`/`diaBROffset` de `src/lib/date.ts` (fuso America/Sao_Paulo, já existente).
- Ordem canônica do plano: `PLANO_FLAT` de `src/data/training.ts`. O índice do dia liberado = `min(dias desde o início, primeiro dia não concluído)`.
- `src/lib/player-store.tsx`: `proximoPlano` só é retornado quando também está liberado por data; expõe `liberadoEm` / `bloqueadoPorData` para a UI. Ciclo de manutenção segue a mesma regra (1 por dia).
- `src/routes/plano.tsx` e `src/routes/app.tsx`: novos estados visuais e contador (`useEffect` com tick de 1 min).
- `src/lib/treinos.functions.ts`: validação equivalente no servidor — recalcula o índice liberado a partir das sessões do usuário e recusa `planoKey` além do dia liberado, para o bloqueio não ser burlável pelo cliente.
- Sem alterações no banco de dados.
