# Plan 1-1: Bootstrap Infraestrutura TanStack Start

**Phase:** 1 — Bootstrap Infraestrutura TanStack Start
**Objective:** Substituir Next.js runtime por TanStack Start + Vite. Dev server roda sem erro na porta 3000.

## Tasks

1. Remover Next.js runtime e instalar dependências TanStack Start
2. Configurar `vite.config.ts` com plugins corretos e aliases
3. Atualizar scripts e `type: module` em `package.json`
4. Criar entry points obrigatórios (`client.tsx`, `ssr.tsx`, `router.tsx`)
5. Criar root layout `routes/__root.tsx`
6. Adaptar Tailwind v4 para Vite (remover postcss, usar `@import "tailwindcss"`)
7. Configurar path aliases e ajustar `tsconfig.json`

## Success Criteria

- `yarn dev` roda sem erro e mostra página básica
- `yarn build` gera output Nitro sem erros críticos de configuração
- Path aliases `@/*` e `lib/*` funcionam em imports
