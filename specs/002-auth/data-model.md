# Phase 1 — Data Model: Auth

Tipos por camada (server/client). Branded + Zod na fronteira; `Result` no server.

## Server / domain (puro)

### Email — `server/domain/email.value-object.ts`
`type Email = Brand<string, 'Email'>` + smart constructor `Email(raw): Result<Email, 'empty'|'invalid-format'>`.
(Nota: o core-api aceita `z.string()` puro no login e rejeita no domínio → `invalid-credentials`. O BFF valida
formato localmente só para UX/anti-request inútil; a autoridade de credencial é o backend.)

### Session — `server/domain/session.types.ts`
```
type Session = Readonly<{
  sessionId: SessionId            // Brand<string,'SessionId'> (crypto.randomUUID)
  userId: string
  accessToken: string             // JWT ES256 (opaco p/ o BFF; decode-only)
  refreshToken: string            // opaco; ROTACIONA a cada refresh → store sempre atualiza
  accessExpiresAt: number         // epoch ms, derivado do exp do JWT
  refreshExpiresAt: number        // epoch ms (login/refresh: now + 30d)
  persistent: boolean             // "lembrar este dispositivo" → cookie com Max-Age
}>
```

### AuthError — `server/domain/auth.errors.ts`
União discriminada (slugs do core-api + locais):
`'invalid-credentials' | 'user-disabled' | 'refresh-not-found' | 'refresh-revoked' | 'refresh-rotated' |
'refresh-expired' | 'unauthorized' | 'session-not-found' | 'connectivity' | 'server'`.

### SessionStore (port) — `server/domain/session-store.port.ts`
```
type SessionStore = Readonly<{
  create(s: Session): Promise<Result<SessionId, 'store-unavailable'>>
  get(id: SessionId): Promise<Result<Session, 'not-found' | 'expired'>>
  update(id: SessionId, s: Session): Promise<Result<void, 'not-found'>>
  delete(id: SessionId): Promise<void>
}>
```
Impl em `external/session` (in-memory dev; compartilhável em prod). TTL = `refreshExpiresAt`.

## Server / adapters (Zod do core-api) — `auth.schema.ts`
```
AuthTokens   = z.object({ accessToken: z.string(), refreshToken: z.string(), userId: z.string() }) // login E refresh
Me           = z.object({ userId: z.string() })
ErrorEnvelope= já em shared/http (error-envelope) — discrimina por error.code
```

## Client / data (Model = padronização do que o BFF entrega) — `auth.model.ts`
```
LoginInput   = z.object({ email: z.email(), password: z.string().min(1), rememberDevice: z.boolean() })
CurrentUser  = z.object({ userId: z.string() })          // o que a UI conhece (R3)
LoginResult  = { ok: true } | { ok:false, error: AppError }  // via Result/QueryError
```
`auth.repository.ts` = **porta**: `login(input)`, `logout()`, `getCurrentUser()` → chamam as server functions
e validam o retorno com Zod, convertendo em `Result`/`QueryError`.

## Client / view-model
- `use-login.view-model.ts`: TanStack **mutation**; expõe `{ status: 'idle'|'submitting'|'error', errorTag, submit }`;
  sucesso → emite `UsuarioAutenticado` + redirect (interno-validado).
- `use-current-user.view-model.ts`: TanStack **query** (`getCurrentUser`); expõe `{ user?: CurrentUser,
  isAuthenticated }`; assina `SessaoEncerrada`/`UsuarioAutenticado` p/ invalidar.

## Client / ui
- `login.page.tsx` (template burro): compõe view-model + controller + components de `shared/ui`.
- `login-form.controller.ts`: estado transiente `{ email, password, rememberDevice, handleSubmit }`; valida
  `LoginInput` (Zod) local antes de entregar ao view-model.

## Eventos (Event Bus, client) — tipos no `client/data` (acessíveis ao client)
```
type AuthEvent =
  | { type: 'UsuarioAutenticado'; userId: string }
  | { type: 'SessaoEncerrada' }
```
(Eventos no **passado**; `client/usecase` emite, `view-model` assina — §XII.)

## i18n (tags) — `shared/i18n`
`auth.error.invalid-credentials`, `auth.error.user-disabled`, `auth.error.connectivity`,
`auth.error.unexpected`, `auth.login.title`, `auth.login.submit`, `auth.login.remember-device`… (textos default
genéricos; **P.O. @lekadecastro** refina).

## Cadeia de erro (fim-a-fim) — Auth
```
core-api 4xx/5xx {error:{code,...}}
 → server/adapters core-api client → Result.err(HttpError)         [server]
 → use-case mapeia p/ AuthError; server-fn → mapToServerResponse    [server, status preservado]
 → client/data Repository: valida Zod, mapToAppError(+slug)         [client boundary] → QueryError(AppError)
 → view-model: AppError.kind → tag i18n; auth:expired → signOut     [client]
 → page burra exibe a tag resolvida
```
