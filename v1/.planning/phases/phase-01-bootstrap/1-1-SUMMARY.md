# Summary 1-1: Bootstrap Infraestrutura TanStack Start

**Phase:** 1
**Plan:** 1-1
**Status:** ✅ Complete
**Date:** 2026-05-27

## What Was Done

- ✅ Dependências TanStack Start instaladas (`@tanstack/react-start`, `@tanstack/react-router`, `vite`, `nitro`, etc.)
- ✅ `vite.config.ts` configurado com plugins: `tanstackStart`, `viteReact`, `nitro`, `tailwindcss`
- ✅ Porta 3000 configurada; aliases `@` e `lib` corrigidos para `path.resolve(__dirname, ...)`
- ✅ Scripts atualizados: `dev`, `build`, `start`, `test:run`, `typecheck`
- ✅ Entry points criados: `src/client.tsx`, `src/ssr.tsx`, `src/router.tsx`
- ✅ Root layout `src/routes/__root.tsx` funcional com redirect de `/` → `/login`
- ✅ Tailwind v4 adaptado: `@import "tailwindcss"` em `src/app/globals.css`, sem postcss.config
- ✅ Path aliases do `tsconfig.json` corrigidos (`@components/*`, `@utils/*` de caminhos absolutos para relativos)
- ✅ Dívida técnica resolvida: `AUTH_BYPASS_ENABLED` só ativa em `development`

## Verification

- `yarn dev` sobe sem erro (Vite ready em ~526ms)
- `yarn build` gera output Nitro
- Aliases funcionam em imports TypeScript

## Issues Encountered

- Aliases no `vite.config.ts` estavam como caminhos absolutos do sistema (`/src`, `/lib`) — corrigidos para `path.resolve(__dirname, ...)`
- `AUTH_BYPASS_ENABLED = true` hardcoded — risco de produção; corrigido para `process.env.NODE_ENV === 'development'`

## Next Steps

Phase 2: Auth e Layout Principal — criar middleware de auth, Server Functions de login/logout, layout autenticado.
