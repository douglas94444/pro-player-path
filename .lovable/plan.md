# Plano anual: de 4 semanas para 12 meses

Transformar a "Campanha de 4 semanas" em uma jornada de 1 ano, com 12 mesociclos de 4 semanas (48 semanas de programa + 4 semanas de deload/avaliação distribuídas), reutilizando os treinos atuais em rotação com progressão de volume e intensidade a cada bloco.

## Estrutura da jornada

```text
Mês  1-3   Fundação      Base · Controle · Explosão · Performance   (carga leve)
Mês  4-6   Domínio       mesmos pilares, volume maior
Mês  7-9   Potência      foco em explosão/força, intensidade maior
Mês 10-12  Elite         ritmo de jogo, sessões mais longas
```

Cada mês = 4 semanas × 5 treinos = 20 sessões. Total: 240 sessões no ano.
A 4ª semana de cada trimestre é uma semana mais leve (regeneração) para o plano ser sustentável.

## O que muda na tela /plano

- Cabeçalho passa a mostrar "Jornada de 12 meses" com progresso `X/12 meses` e `X/52 semanas`.
- Barra de fases (Fundação, Domínio, Potência, Elite) no lugar das 4 barras atuais.
- Meses em cartões recolhíveis: só o mês atual vem aberto; os anteriores aparecem concluídos e os futuros recolhidos, evitando uma página gigantesca.
- Dentro de cada mês, as 4 semanas com seus 5 treinos, do jeito que já funciona hoje (com bloqueio progressivo e selo PRO).
- Título/descrição da página atualizados para a jornada anual.

## O que muda no resto do app

- Dashboard (/app): "Semana X" passa a mostrar "Mês X · Semana Y"; mensagem de plano concluído passa a valer só ao final dos 12 meses.
- Tela de treino: a celebração de "semana desbloqueada" continua; ao fechar um mês, mostra "Mês X concluído".
- Ciclo de manutenção continua existindo, agora acionado depois do ano completo.
- Paywall, XP, streak e conquistas seguem iguais — nenhuma regra de acesso ou cobrança muda.

## Detalhes técnicos

- `src/data/training.ts`: gerar `PLANO` programaticamente a partir de uma tabela de 12 mesociclos (`fase`, `foco`, rotação de `treinoId`, multiplicadores de progressão), mantendo o tipo `SemanaPlano` e as chaves `"<semana>-<dia>"` (semana 1..48/52). `PLANO_FLAT` continua derivado, então progresso já salvo (`1-1`…`4-5`) permanece válido.
- Adicionar `MESES_PLANO` (metadados: número, fase, título, foco, semanas que o compõem) para a UI agrupar sem recalcular.
- `src/routes/plano.tsx`: agrupar por mês, usar `<details>`/estado local para recolher, e derivar mês atual de `proximoPlano.semana`.
- `src/routes/app.tsx` e `src/routes/treino.$treinoId.tsx`: ajustar textos de semana/mês e o marco de conclusão.
- `src/lib/player-store.tsx`: `semanaAtual`/`planoCompleto` continuam derivados de `PLANO_FLAT`; apenas o número mágico `5`/`4` vira o total real de semanas.
- Sem migração de banco: as sessões já guardam a chave do plano como texto.

## Fora do escopo

- Novos treinos e vídeos (reutilização com progressão, conforme combinado).
- Mudança de preços ou de copy da landing.
