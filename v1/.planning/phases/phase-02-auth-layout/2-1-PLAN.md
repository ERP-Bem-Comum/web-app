# Plan 2-1: Auth e Layout Principal

**Phase:** 2 — Auth e Layout Principal
**Objective:** Autenticação cookie HttpOnly e layout autenticado que bloqueiam TODAS as user stories.

## Tasks

1. Criar `src/server/env.ts` — Zod schema validando API_URL, AUTH_SECRET, NODE_ENV
2. Criar `src/shared/http/result-fetch.ts` — wrapper fetch retornando Result<T, HttpError>
3. Criar `src/server/middleware/auth.ts` — lê cookie HttpOnly, injeta session no context
4. Criar `src/server/auth.ts` — login/logout/getSession Server Functions
5. Criar `src/hooks/useAuth.ts` — substitui useSession do next-auth
6. Criar `src/routes/login.tsx` — página de login com Server Function
7. Criar `src/routes/_authenticated.tsx` — layout que verifica sessão e redireciona
8. Migrar componentes de layout para funcionar sem next/navigation
9. Adaptar TopPages e TopPagesWithArrow para useNavigate do TanStack Router

## Success Criteria

- Usuário consegue fazer login, ver layout autenticado, e fazer logout
- Rotas não-autenticadas redirecionam para /login
- Cookie HttpOnly é criado no login e removido no logout
- Nenhum import de `next/navigation` ou `next/router` nos componentes ativos
