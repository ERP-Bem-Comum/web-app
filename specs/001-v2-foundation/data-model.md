# Phase 1 — Data Model: Fundação Técnica do v2

Não há entidades de domínio de negócio nesta fundação. Os "modelos" aqui são os **tipos-base
transversais** que todo módulo consumirá. Todos vivem em `src/shared/`.

> **Primitivos = vendorizados do core-api.** `result.ts`, `brand.ts` e `immutable.ts` são **cópia
> fiel** de `core-api/src/shared/primitives/*` (paridade total de idioma front↔back). Não se importa
> através da fronteira do submódulo (tsconfig exclui `core-api`); copia-se o conteúdo. Ao copiar
> `brand.ts`, remover o `// eslint-disable @typescript-eslint/naming-convention` órfão (regra não
> existe na config do v2).

## Result<T, E> — `shared/primitives/result.ts` *(verbatim do core-api)*

União discriminada por **`.ok` boolean** do resultado de operação falível.

```ts
type Result<T, E> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; error: E }>
```

- Construtores: `ok(value): Result<T, never>`, `err(error): Result<never, E>`.
- Guards: `isOk`, `isErr` (type predicates sobre `.ok`).
- Combinadores: `mapErr(r, f)` e `combine(results)` (agrega tupla de Results → `Result<T[], E[]>`).
- **Invariante**: imutável; nenhum throw; sem `any`. (Sem `map`/`flatMap`/`mapError` — paridade com o backend.)

## Brand<T, K> — `shared/primitives/brand.ts` *(verbatim do core-api)*

Marcador nominal via **`unique symbol`** global (nominal typing real, sem colisão estrutural).

```ts
declare const __brand: unique symbol
type Brand<T, K extends string> = T & { readonly [__brand]: K }
type BrandOf<B> = B extends { readonly [__brand]: infer K } ? K : never
```

- Padrão smart constructor: `const X = (raw): Result<X, XError> => ...` — `as X` permitido **só** internamente.
- Uso restrito a VOs folha (Money, Period, IDs), nunca em agregados.

## Imutabilidade — `shared/primitives/immutable.ts` *(verbatim do core-api)*

`immutable<T extends object>(x): Readonly<T>` (freeze raso) e `deepImmutable<T>(x): T` (freeze recursivo).

## HttpError — `shared/http/http-error.types.ts`

Erro de **transporte** (vive no servidor / borda de I/O).

```ts
type HttpError =
  | Readonly<{ kind: 'network' }>
  | Readonly<{ kind: 'http'; status: number; body: unknown }>
  | Readonly<{ kind: 'parse' }>
  | Readonly<{ kind: 'timeout' }>
  | Readonly<{ kind: 'aborted' }>
```

## AppError — `shared/http/app-error.types.ts`

Erro **semântico** que a UI entende (a UI nunca olha status HTTP).

```ts
type AppError =
  | Readonly<{ kind: 'auth:expired' }>
  | Readonly<{ kind: 'auth:forbidden' }>
  | Readonly<{ kind: 'not-found' }>
  | Readonly<{ kind: 'validation'; issues: readonly string[] }>
  | Readonly<{ kind: 'conflict' }>
  | Readonly<{ kind: 'server' }>
  | Readonly<{ kind: 'connectivity' }>
  | Readonly<{ kind: 'bad-gateway' }>
  | Readonly<{ kind: 'unknown'; status?: number }>
```

> `issues` permanece no tipo (contrato estável p/ UI), mas vem **vazio** do core-api (que não detalha
> validação). O BFF preenche `issues` quando fizer validação Zod local antes de proxiar.

## ErrorEnvelope (core-api) — `shared/http/error-envelope.ts`

Parser do envelope real do backend, usado por `map-to-app-error` para enriquecer contexto.

```ts
type ErrorEnvelope = Readonly<{
  error: Readonly<{ code: string; message: string; requestId: string }>
}>
// parseErrorEnvelope(body: unknown): ErrorEnvelope | null   (narrowing seguro, sem throw)
```

## QueryError — `shared/http/query-error.ts`

A **única** subclasse de `Error` do projeto. Ponte `Result/AppError` ↔ TanStack Query.

```ts
class QueryError extends Error {
  readonly appError: AppError
  // + isQueryError(e): e is QueryError
}
```

## EnvConfig — `external/config/env.config.ts`

Configuração validada (Zod), fail-fast na inicialização.

| Campo | Tipo | Regra |
|-------|------|-------|
| `CORE_API_URL` | string (URL) | obrigatório; URL válida (ex.: `http://localhost:3001/api/v2`) |

> Expansível: `SESSION_SECRET`, `REDIS_URL` entram com a feature Auth, não aqui.

## SessionStore (port) — `shared/ports/session-store.port.ts` *(esboço OPCIONAL — C1)*

> **Sem FR nesta fundação.** Incluído só como terreno para a feature Auth; pode ser adiado e nascer
> diretamente na spec de Auth. Se mantido aqui, fica apenas como **contrato** (type), sem adapter real.

```ts
type SessionStore = Readonly<{
  get(id: string): Promise<Result<Session, 'not-found' | 'expired'>>
  // create / update / delete — assinatura definida na feature Auth
}>
```

## Transições / Cadeia de erro (fim-a-fim)

```
core-api 4xx/5xx ({error:{code,message,requestId}})
  → result-fetch → Result.err(HttpError)                    [external, sem throw]
  → map-to-server-response → Response (status preservado)    [external]
  → queryFn (módulo) → throw QueryError(map-to-app-error)    [adapters, boundary do client]
  → QueryClient.queryCache.onError (auth:expired → signOut)  [composition root]
  → switch exaustivo em AppError.kind → label i18n           [ui — ViewModel/view]
```
