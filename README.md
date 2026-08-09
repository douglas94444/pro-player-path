# Pro Player Path

Você é um desenvolvedor sênior especializado em SaaS, UX e produtos digitais escaláveis.

Quero que você construa um MVP completo de um SaaS de treinos esportivos chamado:

"Jogador PRO System"

O objetivo é criar uma plataforma de assinatura (estilo Netflix + Duolingo + Nike Training Club), onde usuários seguem um plano guiado de treinos para evoluir no futebol.

---

# 🎯 OBJETIVO DO PRODUTO

Criar um sistema simples, viciante e guiado onde o usuário abre o app e sabe exatamente qual treino fazer no dia.

Regra principal:

O usuário NUNCA pode pensar “o que fazer agora?”

---

# 👤 PÚBLICO-ALVO

- Homens de 14 a 35 anos

- Jogadores amadores de futebol/futevôlei

- Querem melhorar performance (explosão, resistência, controle)

- Treinam sozinhos e não têm orientação

---

# 💰 MODELO DE NEGÓCIO

Assinatura:

- Mensal: R$47

- Semestral: R$147

- Anual: R$197

Implementar lógica de paywall e bloqueio de conteúdo para não assinantes.

---

# 🧱 FUNCIONALIDADES PRINCIPAIS

## 1. Dashboard (Home)

- Saudação com nome do usuário

- Streak de dias treinados (🔥)

- Nível do jogador (iniciante, intermediário, avançado)

- Card principal: “Treino de Hoje”

  - Nome do treino

  - Duração

  - Botão: “Começar agora”

- Barra de progresso semanal

---

## 2. Plano Guiado (CORE DO PRODUTO)

- Treinos organizados em semanas:

  - Semana 1: Base

  - Semana 2: Controle + Core

  - Semana 3: Explosão

  - Semana 4: Performance

- Cada semana tem treinos diários (Dia 1, Dia 2, etc.)

- Usuário deve concluir o treino atual para liberar o próximo

- Mostrar progresso visual (check ✅)

---

## 3. Tela de Treino

- Player de vídeo (embed ou mock)

- Nome do treino

- Tempo total

- Lista de exercícios

- Botões:

  - Play / Pause

  - Próximo exercício

- Botão final: “Marcar como concluído”

---

## 4. Biblioteca de Treinos

- Lista de treinos extras

- Filtros:

  - Em casa

  - Campo

  - Explosão

  - Resistência

  - Core

---

## 5. Progresso do Usuário

- Streak de dias

- Total de treinos feitos

- Tempo total treinado

- Conquistas:

  - 7 dias seguidos

  - 30 treinos

  - 1 semana completa

---

## 6. Sistema de Gamificação

- Streak 🔥

- Níveis (Iniciante → PRO)

- Badges/conquistas

- Feedback positivo ao concluir treino

---

## 7. Paywall

- Tela de bloqueio para não assinantes

- Mostrar planos:

  - Mensal

  - Semestral (destacado)

  - Anual

- Botão: “Liberar acesso”

---

## 8. Autenticação

- Login com email e senha

- Cadastro simples

- Persistência de progresso

---

# 🎨 DESIGN / UX

- Estilo minimalista e esportivo

- Cores:

  - Preto (fundo)

  - Verde neon (destaques)

  - Branco (texto)

- Interface mobile-first

- UX extremamente simples (no máximo 2 cliques para iniciar treino)

---

# ⚙️ STACK (preferência)

- Frontend: Next.js (React)

- Backend: Supabase

- Auth: Supabase Auth

- Banco: PostgreSQL (via Supabase)

- Vídeo: mock ou embed Vimeo

- Deploy: Vercel

---

# 📦 ESTRUTURA DE DADOS (SUGESTÃO)

Users:

- id

- nome

- email

- plano

- nível

- streak

Treinos:

- id

- nome

- duração

- nível

- categoria

- vídeo_url

Plano:

- semana

- dia

- treino_id

Progresso:

- user_id

- treino_id

- concluído

- data

---

# 🔥 DIFERENCIAL IMPORTANTE

Adicionar funcionalidade:

“MODO RÁPIDO”

Botão: “Tenho 10 minutos hoje”

→ Sistema sugere automaticamente um treino rápido

---

# 🚀 ENTREGA ESPERADA

Quero que você gere:

1. Estrutura de pastas do projeto

2. Código base (frontend + backend)

3. Componentes principais (Dashboard, Plano, Treino)

4. Lógica de progressão de treino

5. UI simples, funcional e moderna

6. Dados mockados para testes

---

# ⚠️ PRIORIDADE

- Simplicidade > perfeição

- UX fluida > features complexas

- Produto funcional > código perfeito

---

Crie isso como um MVP funcional pronto para evolução.

HOME (dashboard principal)

7

🎯 Objetivo:

Levar o cara direto pro treino do dia

🧱 Estrutura:

🔥 Topo:

 “Fala, Douglas 👊”

 Streak: 🔥 5 dias seguidos

 Nível: Jogador Intermediário

🎯 Card principal (O MAIS IMPORTANTE):

✅ Treino de Hoje

 Nome: “Explosão + Core”

 Tempo: 12 min

 Botão: COMEÇAR AGORA

📊 Progresso:

 Semana 2 de 4

 Barra de progresso

⚡ Ações rápidas:

 Ver todos os treinos

 Continuar último treino

 Ver evolução

📅 2. PLANO GUIADO (o coração do SaaS)

6

🎯 Objetivo:

Fazer o usuário seguir um caminho (não se perder)

🧱 Estrutura:

🗓️ Semana atual:

Semana 2 — Controle + Core

📆 Dias:

 ✅ Dia 1 – concluído

 ✅ Dia 2 – concluído

 ▶️ Dia 3 – HOJE

 🔒 Dia 4 – bloqueado

 🔒 Dia 5 – bloqueado

👉 Isso cria:

 expectativa

 disciplina

 retenção

🧠 Lógica:

 Libera próximo treino só após concluir o anterior

 Sensação de progresso

▶️ 3. TELA DE TREINO

6

🎯 Objetivo:

Execução sem fricção

🧱 Estrutura:

🎥 Vídeo (full destaque)

 Autoplay

 Tela limpa

⏱️ Info:

 Tempo total

 Exercício atual

 Próximo exercício

🔘 Controles:

 Pausar

 Próximo

 Voltar

✅ Final:

“Treino concluído 👊”

 Botão: marcar como concluído

 Feedback positivo

📚 4. BIBLIOTECA DE TREINOS

6

🎯 Objetivo:

Exploração (sem bagunçar o foco)

🧱 Filtros:

 🏠 Em casa

 ⚽ Campo

 💪 Força

 ⚡ Explosão

 🧠 Core

Cards:

 Nome do treino

 Tempo

 Nível

📊 5. PROGRESSO (dopamina 💰)

6

🎯 Objetivo:

Viciar o usuário

🧱 Elementos:

 🔥 Streak atual

 📅 Dias treinados

 ⏱️ Tempo total treinado

 📈 Evolução semanal

🏆 Conquistas:

 7 dias seguidos

 30 treinos feitos

 Semana completa

👤 6. PERFIL

🧱 Conteúdo:

 Nome

 Nível atual

 Plano ativo

 Configurações

💰 7. PAYWALL (onde entra o dinheiro)

6

🎯 Objetivo:

Converter rápido

🧱 Estrutura:

Headline:

Comece a treinar como atleta hoje

Planos:

 Mensal R$47

 Semestral (mais vendido 🔥)

 Anual (melhor valor)

CTA:

“Liberar acesso agora”

🔁 FLOW COMPLETO DO USUÁRIO

🧠 Jornada:

 Vê vídeo no Instagram

 Clica no link

 Landing page

 Compra

 Cai no app

Dentro do app:

 Abre → vê treino do dia

 Executa

 Marca como concluído

 Ganha progresso

 Volta amanhã

👉 Isso = retenção = dinheiro

💣 DIFERENCIAL (isso aqui muda o jogo)

Se quiser ficar acima de 99%:

🔥 “MODO RÁPIDO”

Botão:

“Tenho 10 minutos hoje”

👉 Ele gera treino automático

🔥 “TREINO DO DIA AUTOMÁTICO”

Nunca deixa o usuário pensar

🚀 RESUMO (visão de produto forte)

Seu SaaS precisa ser:

 Simples

 Guiado

 Viciante

 Progressivo

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c0377e2e-64f5-4e7b-ba5b-04b3e9401e3f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
