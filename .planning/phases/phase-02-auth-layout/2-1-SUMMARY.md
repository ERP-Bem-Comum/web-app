# Summary 2-1: Auth e Layout Principal

**Phase:** 2
**Plan:** 2-1
**Status:** ✅ Complete
**Date:** 2026-05-27

## What Was Done

- ✅ `src/server/env.ts` — Zod schema validando `API_URL`, `AUTH_SECRET`, `NODE_ENV`
- ✅ `src/shared/http/result-fetch.ts` — wrapper `fetch` retornando `Result<T, HttpError>` com timeout 30s
- ✅ `src/server/middleware/auth.ts` — middleware que lê cookie `session-token`, decodifica JWT, valida expiração, injeta session no context
- ✅ `src/server/auth.ts` — Server Functions: `login` (POST, cria cookie HttpOnly com JWT), `logout` (POST, remove cookie), `getSession` (GET, usa auth middleware)
- ✅ `src/hooks/useAuth.ts` — hook com `useQuery` (getSession) + `useMutation` (logout), expõe `{ user, isLoading, isAuthenticated, logout }`
- ✅ `src/routes/login.tsx` — página de login funcional, chama `login` Server Function, redireciona para `/contratos`
- ✅ `src/routes/_authenticated.tsx` — layout autenticado com sidebar + topbar, proteção de rota (redireciona para login se não autenticado)
- ✅ `src/components/layout/main/PageContainer.tsx` — sem imports Next.js, funcional
- ✅ `src/components/TopPages.tsx` — adaptado de `useRouter` (next/navigation) para `useNavigate` (TanStack Router)
- ✅ `src/components/TopPagesWithArrow.tsx` — adaptado de `useRouter` (next/navigation) para `useNavigate` (TanStack Router)

## Verification

- `yarn typecheck` não reporta erros nos arquivos modificados (erros restantes são do legado `src/app/`)
- Nenhum `next/navigation` ou `next/router` nos componentes ativos da nova arquitetura
- Fluxo de auth: login → cookie → sessão → layout autenticado; logout → cookie removido

## Issues Encountered

- `TopPages.tsx` e `TopPagesWithArrow.tsx` ainda usavam `useRouter` do Next.js — corrigidos para `useNavigate` do TanStack Router
- Proteção de rota implementada no componente do layout autenticado (redirect client-side quando `!isAuthenticated`)

## Next Steps

Phase 3: User Story 2 — Listar Contratos. Criar domain types, schemas, adapters, Server Functions e views da listagem.
