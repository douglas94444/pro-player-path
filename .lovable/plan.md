# Do "plataforma de vídeos" para "app que transforma atleta"

A análise está certa no essencial. O que ela chama de MVP é real: hoje o app já tem streak, XP, níveis, conquistas (em `/progresso`) e plano de 4 semanas, mas a recompensa é discreta, a Home esvazia depois do card de hoje e os cards de treino não têm imagem nem identidade. Dois pontos da análise já existem e só precisam ficar visíveis: conquistas e recomendações. O resto é trabalho de percepção de valor.

Plano em 5 frentes, na ordem de maior impacto por esforço.

## 1. Recompensa ao concluir treino
Tela de conclusão virar um momento, não um aviso:
- Contagem animada de XP ganho, +1 streak, barra de nível subindo
- Confete + som curto (respeitando `prefers-reduced-motion` e um mute no perfil)
- Badge desbloqueada aparece em destaque quando acontece
- "Semana X desbloqueada" quando o dia fecha a semana
- CTA final: próximo treino ou voltar ao dashboard

## 2. Dashboard vivo
Abaixo do card de hoje, blocos com dado real do store:
- Faixa de estatísticas: dias seguidos, treinos concluídos, minutos totais, XP total
- Meta semanal (x/5 treinos) com mini-calendário dos 7 dias
- "Próxima conquista" com barra de quanto falta
- "Continue de onde parou" quando existe sessão salva no sessionStorage
- Nível atual com progresso até o próximo

## 3. Cards de treino com cara de produto
- Thumbnail por treino (arte gerada por categoria: casa, campo, força, explosão, core), com fallback ao bloco de cor atual
- Selo de intensidade, duração e XP estimado no card
- Aplicar o mesmo card na Home, Biblioteca e Plano

## 4. Plano como jornada
- Cada semana com cor e nome próprios: Base (verde), Controle (azul), Explosão (roxo), Performance (laranja)
- Trilha vertical com nós de dia (feito / hoje / bloqueado) em vez de lista neutra
- Barra de campanha "2 de 4 semanas" no topo e estado de campanha concluída

## 5. Identidade visual
- Camada de marca sobre o tema atual: textura/gradiente de fundo sutil, tipografia de título mais atlética, tratamento consistente de imagem
- Tudo via tokens em `src/styles.css`, sem cor hardcoded

## Notas técnicas
- Trabalho concentrado em `src/routes/app.tsx`, `src/routes/plano.tsx`, `src/routes/progresso.tsx`, `src/routes/treino.$treinoId.tsx`, um novo `src/components/TreinoCard.tsx` e um novo `src/components/TreinoConcluido.tsx`
- Estatísticas derivadas do que já está em `player-store` e nas sessões do Supabase — sem mudança de schema
- Conquistas continuam vindo de `CONQUISTAS` em `src/data/training.ts`; só ganham superfície nova
- Thumbnails geradas como assets locais importados, sem custo de rede externo

## Fora deste passo
Ranking social, desafios entre usuários e novos vídeos de conteúdo.
