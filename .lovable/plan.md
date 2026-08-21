# CSP bloqueando script do editor Lovable no preview

## Diagnóstico

O erro mostrado no console é do build antigo: a string `script-src` não inclui `https://cdn.gpteng.co` nem os hosts `*.lovable.*` no `connect-src`, que são exatamente as correções já aplicadas em `src/lib/security-headers.ts`.

## Estado atual do código (verificado)

- `src/lib/security-headers.ts` já libera `https://cdn.gpteng.co` quando o host é de preview Lovable (`*.lovable.app`, `*.lovable.dev`, etc.).
- `src/lib/security-headers.test.ts` cobre os dois casos (preview libera, produção não libera).
- Não existe outra definição de CSP no projeto que possa estar conflitando.
- O middleware em `src/start.ts` aplica os headers em toda resposta do servidor.

## Ação proposta

A correção de código está pronta. O próximo passo é garantir que o preview esteja servindo o build mais recente:

1. **Publicar/republicar o app** para que o bundle servido em `*.lovable.app` reflita o `src/lib/security-headers.ts` atual.
2. **Verificar no preview** se o header `Content-Security-Policy` da resposta contém `https://cdn.gpteng.co`.
3. **Se o erro persistir**, investigar cache de CDN, headers duplicados ou diferença entre o host detectado e o esperado.

## Arquivos relacionados

- `src/lib/security-headers.ts`
- `src/lib/security-headers.test.ts`
- `src/start.ts`
