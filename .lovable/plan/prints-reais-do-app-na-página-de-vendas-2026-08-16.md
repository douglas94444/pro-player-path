# Prints reais do app na página de vendas

Trocar os mockups desenhados em CSS da seção "Veja por dentro" pelos 3 prints reais que você enviou, cada um dentro de uma moldura de celular.

## O que muda

**1. Prints como assets**
Os 3 prints enviados (Meu plano / jornada de 12 meses, Dashboard com meta da semana + patente + treino de hoje, Biblioteca de treinos) vão para o CDN de assets e são importados na landing.

**2. Moldura de celular**
Novo componente de mockup: corpo do aparelho com bordas arredondadas, notch discreto, brilho sutil e sombra. Cada print entra dentro da tela, recortado com `overflow-hidden` e `object-top` para o topo do print aparecer sempre.

**3. Layout da seção**
3 aparelhos lado a lado no desktop (o do meio levemente maior/à frente, os laterais rotacionados poucos graus), empilhados em coluna no mobile. Cada um com legenda curta abaixo:
- Jornada de 12 meses, mês a mês
- Seu dia pronto: meta, streak e treino de hoje
- Biblioteca completa de treinos com filtros

**4. Copy atualizada**
A legenda do plano hoje diz "Plano de 4 semanas" — passa a refletir a jornada de 12 meses. Textos ficam em `campanha-copy.ts`.

## Detalhes técnicos

- `lovable-assets create` a partir dos uploads; pointers `.asset.json` em `src/assets/`, importados como ES module.
- `src/components/landing/AppShowcase.tsx`: substituir os `Frame` em CSS por `PhoneFrame` + `<img loading="lazy" decoding="async">` com `alt` descritivo.
- `src/data/campanha-copy.ts`: chaves `showcase.dashboard/plano/treino` atualizadas.
- Só tokens semânticos do design system; sem cor hardcoded.
- Verificação em 390x844 e desktop, sem overflow lateral.
