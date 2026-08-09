# Jogador PRO System — MVP frontend (mock)

App de treinos de futebol em formato SaaS, mobile-first, tema preto + verde neon. Tudo funciona com dados mockados e progresso salvo no navegador — depois é só plugar Supabase quando o Cloud estiver ativo.

## Regra central de UX
Ao abrir o app, o usuário vê imediatamente o Treino de Hoje e um botão "Começar agora". Nunca mais de 2 cliques até iniciar.

## Telas

**Home / Dashboard (`/`)**
- Saudação "Fala, {nome} 👊", streak 🔥, nível do jogador
- Card grande: Treino de Hoje (nome, duração, botão COMEÇAR AGORA)
- Barra de progresso "Semana 2 de 4"
- Botão "Tenho 10 minutos hoje" (Modo Rápido → sorteia treino curto e já abre)
- Atalhos: ver todos os treinos, continuar último, ver evolução

**Plano Guiado (`/plano`)**
- 4 semanas: Base, Controle + Core, Explosão, Performance
- Dias com estados: concluído ✅ / hoje ▶️ / bloqueado 🔒
- Próximo dia só destrava após concluir o anterior

**Treino (`/treino/$id`)**
- Bloco de player mock (arte + timer), autoplay simulado
- Exercício atual, próximo exercício, tempo total
- Controles: pausar/retomar, próximo, voltar
- Final: "Treino concluído 👊" com feedback (confete/XP) e botão marcar como concluído

**Biblioteca (`/biblioteca`)**
- Grade de treinos extras, filtros: Em casa, Campo, Força, Explosão, Core
- Card: nome, tempo, nível; conteúdo extra bloqueado para não assinante

**Progresso (`/progresso`)**
- Streak, dias treinados, tempo total, evolução semanal
- Conquistas: 7 dias seguidos, 30 treinos, semana completa (com estado bloqueado/desbloqueado)

**Perfil (`/perfil`)**
- Nome, nível, plano ativo, preferências simples, alternar estado assinante (para testar o paywall)

**Paywall (`/planos`)**
- Headline "Comece a treinar como atleta hoje"
- Mensal R$47 · Semestral R$147 (mais vendido, destacado) · Anual R$197
- CTA "Liberar acesso agora" (simulado — pagamento real fica para depois)

Navegação inferior fixa: Home · Plano · Biblioteca · Progresso · Perfil.

## Gamificação
Streak diário, níveis Iniciante → Intermediário → Avançado → PRO por treinos concluídos, badges e feedback positivo ao concluir.

## Detalhes técnicos
- TanStack Start + rotas em `src/routes/` (Next.js não é suportado aqui; a stack é equivalente em React/SSR)
- Design tokens em `src/styles.css`: fundo preto, verde neon como primária, branco no texto; sem cores hardcoded
- Dados mockados em `src/data/` (treinos, plano de 4 semanas, conquistas)
- Estado do usuário (streak, treinos concluídos, assinatura, nível) num store com persistência em localStorage, isolado em `src/lib/` para troca fácil por Supabase
- Login/cadastro e paywall reais dependem do Lovable Cloud; por enquanto ficam simulados na camada de perfil
- `head()` por rota com título/descrição próprios

## Fora deste passo
Auth real, banco, cobrança Stripe/Paddle e vídeos reais — entram quando o Cloud for ativado.
