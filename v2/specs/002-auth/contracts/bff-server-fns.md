# Contract — BFF Server Functions (fronteira client↔server da Auth)

As server functions são a **fronteira RPC**. O `client/data/repository` é o único client que as chama; elas
rodam server-side (em `modules/auth/server/adapters`), tocam o `SessionStore` e o core-api, e **nunca** devolvem
token ao browser. Input validado por Zod; saída mínima.

## login — `login.server-fn.ts`
- **Input (Zod):** `{ email: string, password: string, rememberDevice: boolean }`
- **Faz:** valida → core-api `POST /login` → cria `Session` no store → seta cookie `__Host-session` (sessionId
  opaco; `Max-Age` só se `rememberDevice`) → emite nada ao browser além do cookie.
- **Retorno ao client:** `{ userId: string }` (ou erro preservando status → `AppError` no client).
- **Erros mapeados:** invalid-credentials, user-disabled, connectivity.

## logout — `logout.server-fn.ts`
- **Input:** nenhum (usa o cookie).
- **Faz:** resolve sessão → core-api `POST /logout {refreshToken}` → apaga sessão → limpa cookie. Limpa
  local **mesmo se** o core-api falhar (FR-011).
- **Retorno:** `{ ok: true }` (204-like).

## me / current user — `me.server-fn.ts`
- **Input:** nenhum (cookie).
- **Faz:** `session.guard` resolve cookie→sessão→accessToken (refresh silencioso single-flight se expirado) →
  core-api `GET /me` com Bearer → `{ userId }`. Sem sessão → erro `auth:expired`.
- **Retorno:** `{ userId: string }`.

## session.guard (não é server fn — helper server-side)
- Resolve cookie → `SessionStore.get` → checa `accessExpiresAt` (decode-only). Se access expirado e refresh
  válido → **refresh single-flight** (core-api `POST /refresh`, atualiza store com o **novo** refresh). Se refresh
  inválido/rotated/expired → apaga sessão + limpa cookie → `auth:expired`. Injeta o Bearer nas chamadas ao core-api.
- Usado por `me.server-fn` e por server functions de **outros módulos** (via `public-api` da auth) para proteger rotas.

## Guard de rota (client) — exposto no `public-api`
- `beforeLoad` das rotas `_authenticated/*`: chama `me` (ou lê o estado de sessão); sem sessão →
  `redirect({ to: '/login', search: { redirect: <rota-interna-validada> } })`. `/login` faz o inverso
  (logado → `/`).
