# Wave 1 Summary: Infraestrutura + Cross-cutting + Auth Real

**Phase:** 12 — Integração com Backend core-api
**Wave:** 1/5
**Date:** 2026-05-28
**Status:** ✅ Complete

## Tasks Executed

### 1. Instalar dependências
- `ofetch`, `iron-session`, `jose`, `unstorage`, `@t3-oss/env-core`
- `neverthrow`, `fp-ts`, `newtype-ts`
- Todas instaladas via yarn 4.14.1 com compatibilidade ESM confirmada

### 2. Configurar variáveis de ambiente
- `src/server/env.ts` migrado para `@t3-oss/env-core` com `CORE_API_URL`, `SESSION_SECRET`, `REDIS_URL`
- `API_URL` mantido como alias de `CORE_API_URL` para backward compatibility durante migração
- `.env.example` e `.env.local` atualizados com novas variáveis
- `CORE_API_URL` aponta para `http://localhost:3000/api/v2`

### 3. Criar `lib/fp-ts-neverthrow-bridge.ts`
- `teToResultAsync<L, R>()` — converte `TaskEither` → `ResultAsync`
- `resultAsyncToTe<L, R>()` — converte `ResultAsync` → `TaskEither`
- Type-safe em ambas as direções

### 4. Refatorar `src/shared/http/result-fetch.ts`
- Base trocado de `fetch` nativo para `ofetch`
- Retorno agora é `ResultAsync<T, HttpError>` (neverthrow)
- Configurações: retry 3x, timeout 10s, auto-parse JSON
- Suporte a `responseType: 'blob'`, upload `Blob`/`Buffer` via `body`
- `mapHttpError` aprimorado com extração de mensagens do backend

### 5. Criar `src/server/http/result-fetch.ts`
- Wrapper `serverFetch<T>()` que injeta `baseURL` do `env.CORE_API_URL`
- Reutiliza `resultFetch` do shared com path relativo ou URL absoluta

### 6. Criar `features/auth/infrastructure/session-store.ts`
- `SessionStore` port implementado com `unstorage`
- Driver: `memory` em dev, `redis` em prod (via `REDIS_URL`)
- Estrutura: `{ accessToken, refreshToken, userId, email, expiresAt }`
- Funções: `createSession`, `getSession`, `deleteSession`, `updateSession`

### 7. Criar `features/auth/infrastructure/auth-session.ts`
- `iron-session` com `SESSION_SECRET` (seal/unseal)
- Cookie: `HttpOnly; SameSite=Strict; Path=/; Secure` (prod)
- Seal contém **apenas** `sessionId` opaco — nunca tokens
- Integração com `getCookie`/`setCookie`/`deleteCookie` do TanStack Start

### 8. Criar `features/auth/infrastructure/refresh-token.server-fn.ts`
- `refreshAccessToken(sessionId)` — função pura que chama `POST /api/v2/auth/refresh`
- Atualiza access token (e refresh token rotacionado) no `unstorage`
- `createServerFn` wrapper `refreshToken()` para uso explícito
- Retorna erro estruturado se refresh token inválido/expirado

### 9. Refatorar `src/server/middleware/auth.ts`
- Usa `iron-session` para ler cookie e extrair `sessionId`
- Lookup no `unstorage` → recupera access + refresh tokens
- Verifica expiração do access token via `jose.decodeJwt`
- Se expirado → chama `refreshAccessToken` silenciosamente
- Se refresh inválido → limpa sessão + cookie → 401
- Injeta `accessToken` no `context` (não mais token mock)
- Tipos `Session` e `AuthContext` atualizados (`userId: string`, `accessToken: string`)

### 10. Criar `features/auth/infrastructure/login.server-fn.ts`
- `POST /api/v2/auth/login` do backend real
- Recebe `{ accessToken, refreshToken, userId, email }`
- Cria sessão opaca no `unstorage` + cookie `iron-session`
- Retorna `{ user: { id, email } }`

### 11. Criar `features/auth/infrastructure/logout.server-fn.ts`
- `POST /api/v2/auth/logout` no backend (revoga refresh token)
- Remove do `unstorage` + limpa cookie via `destroyAuthSession`
- Retorna `{ success: true }`

### 12. Criar `features/auth/infrastructure/me.server-fn.ts`
- `GET /api/v2/auth/me` com access token do contexto
- Usa `authMiddleware` para garantir autenticação
- Retorna `{ user: { id, email, name } }` com fallback para nome derivado do email

### 13. Atualizar `src/hooks/useAuth.ts`
- Importa `getMe` e `logout` das novas Server Functions em `features/auth/infrastructure/`
- Interface pública do hook preservada: `user`, `isAuthenticated`, `logout`

### 14. Atualizar `src/routes/login.tsx`
- Usa nova `login` Server Function de `features/auth/infrastructure/`
- Tratamento de erros do backend real:
  - `401` → "Credenciais inválidas..."
  - `403` → "Acesso negado..."
  - `503` → "Serviço temporariamente indisponível..."

## Files Created

```
lib/fp-ts-neverthrow-bridge.ts
src/server/http/result-fetch.ts
src/features/auth/infrastructure/session-store.ts
src/features/auth/infrastructure/auth-session.ts
src/features/auth/infrastructure/refresh-token.server-fn.ts
src/features/auth/infrastructure/login.server-fn.ts
src/features/auth/infrastructure/logout.server-fn.ts
src/features/auth/infrastructure/me.server-fn.ts
```

## Files Modified

```
src/server/env.ts
src/shared/http/result-fetch.ts
src/server/middleware/auth.ts
src/hooks/useAuth.ts
src/routes/login.tsx
.env.example
src/server/auth.ts (compatibilidade temporária)
src/server/contracts.ts (compatibilidade temporária)
src/server/budget-plans.ts (compatibilidade temporária)
src/server/partners.ts (compatibilidade temporária)
src/features/contracts/adapters/http/contracts.ts (compatibilidade temporária)
```

## Quality Gate

- ✅ `yarn typecheck` — sem erros nos arquivos modificados/criados nesta wave
- ✅ Commits atômicos com mensagem no formato `feat(phase-12/wave-1): ...`
- ✅ Sem modificações em `STATE.md` ou `ROADMAP.md`

## Next Wave

Wave 2: Domain Types + Server Functions Read (tasks 15-18, 22)
- Atualizar domain types para UUID e centavos
- Criar Server Functions de leitura de contratos
