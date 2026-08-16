# Depoimentos reais na página de vendas

Os 10 prints enviados são mensagens de alunos (estilo WhatsApp/Discord). Em vez de colar as imagens cruas — que ficam ilegíveis no mobile e destoam do visual — o texto de cada uma vira um depoimento nativo, com tipografia, cores e molduras do projeto (dark + verde neon).

## O que entra na página

Nova seção "Quem já treina", entre a seção de Prova e o FAQ:

- Grid de balões de mensagem (1 coluna no mobile, 2–3 no desktop), cada um com avatar em círculo com a inicial, nome curto e o texto do depoimento.
- Balões com o mesmo arredondamento, borda e sombra dos cards atuais; destaque em verde nos trechos de resultado.
- Um selo discreto de "mensagens reais de alunos" abaixo da grade, para dar contexto sem prometer números.
- Um CTA ao fim da seção que rola para a oferta, igual aos outros blocos.

## Ajuste de texto

Cada depoimento é limpo (pontuação, acentos, maiúsculas) mantendo o tom original e o sentido — nada é inventado nem exagerado. Exemplos:

- "Comecei ontem e já senti melhora no físico e na parte técnica. Faço tudo pelo celular."
- "Já perdi muito dinheiro com curso que não ensinava nada. Aqui finalmente encontrei algo confiável."
- "Muito obrigado por esse treino, tava precisando muito. Agora sim é confiável."
- "Tô aprendendo o último drible. Em 1 ou 2 meses de treino você já consegue aplicar em jogo de verdade."
- "O 6º drible eu uso pra fazer gol, passa por baixo da perna do adversário."
- "Perfeito, eu vou conseguir jogar melhor."
- "Parece que ele acelera o vídeo de tão rápido e ágil que é. Brabo demais."

Nomes: como os prints não mostram identidade, cada depoimento recebe apenas um primeiro nome genérico + inicial (ex.: "Lucas M.") ou pode ficar como "Aluno PRO" — me diga se prefere usar nomes reais que você tenha.

## Detalhes técnicos

- `src/data/campanha-copy.ts`: novo bloco `depoimentos` com `{ nome, inicial, texto, destaque? }` e títulos da seção.
- `src/components/landing/DepoimentosSection.tsx`: novo componente com a grade de balões, usando tokens semânticos (`bg-card`, `text-primary`, `border-border`) — sem cores hardcoded.
- `src/components/LandingPage.tsx`: renderiza a seção nova entre Prova e FAQ, reaproveitando `Section`/`Eyebrow`.
- As imagens enviadas ficam apenas como referência; não entram como assets.
