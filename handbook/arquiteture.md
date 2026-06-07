# Architecture — BFF-Orchestrated, Functional Frontend

> Template reutilizável. Front + BFF unificado (TanStack Start / meta-framework com
> server functions + SSR). Erros como valores (`Result`), camadas com fronteiras
> rígidas, BFF como único ponto que toca I/O e segredos.

## TL;DR

1. **Um app = front + BFF.** O browser nunca fala direto com a API/microserviços — fala com o próprio BFF (server functions), que autentica, orquestra e normaliza.
2. **Erros são valores** (`Result<T,E>`), não exceções. `throw` só na borda de infra, convertido em `Result` imediatamente.
3. **Camadas:** `domain → application → infrastructure → ui`, fronteiras enforçadas por lint. Domínio é puro (sem HTTP, sem framework).
4. **Estado:** server-state no cache do client (TanStack Query); UI-state em `useReducer`/state machine. Nunca misturar.
5. **Validação na fronteira:** input do usuário e response do backend viram tipos do domínio (branded + smart constructors). Para dentro, tudo é total e tipado.

## Stack (recomendada — substituível)

| Camada         | Escolha                                            | Substituível por             |
| -------------- | -------------------------------------------------- | ---------------------------- |
| Meta-framework | TanStack Start (Vite+Nitro)                        | Next.js (app router) / Remix |
| Server state   | TanStack Query (client-only cache)                 | SWR                          |
| Forms          | TanStack Form + Zod                                | React Hook Form + Zod        |
| Validação      | Zod                                                | Valibot                      |
| Tipos          | TypeScript strict máximo                           | —                            |
| Testes         | Vitest (DOM) + node:test (puro) + Playwright + MSW | Jest                         |

## Princípios invariantes

- **Sem `class`** (exceto `QueryError`, a ponte com TanStack Query), **sem `this`, sem `throw`** fora da borda de infra.
- **Sem `any`** — `unknown` + narrowing; `as` só com comentário justificando.
- **Imutabilidade:** `Readonly<>`, `readonly T[]`, `as const`.
- **Discriminated unions + `switch` exaustivo** (compilador pega variante faltante).
- **Branded types + smart constructors** — estado inválido é irrepresentável.
- **Minimal libs:** prefira nativo (`Intl`/`Temporal`, `crypto.randomUUID`, `EventTarget`, `AbortController`) a libs (date-fns, mitt, Effect).

## Estrutura de pastas

> ⚠️ **DIVERGÊNCIA (v2 — constituição v1.2.0):** a estrutura abaixo (`features/`+`lib/`+`server/`)
> foi **substituída**. O frontend v2 usa módulos verticais com **separação client × server** (ADR-0004):
> `src/modules/<m>/server/{domain,application,adapters}` (BFF, **DDD**) + `src/modules/<m>/client/{data,
> usecase,view-model,ui}` (FRONT, **MVVM**) + `public-api/`; `src/shared/` (puro, inclui `bus`/`i18n`) e
> `src/external/` (I/O real + segredos, server-only). **Fronteira client↔server = a server function.**
> Fonte de verdade: [`.specify/memory/constitution.md`](../.specify/memory/constitution.md) (v1.2.0) +
> [`handbook/adr/`](./adr/) (ADR-0001/0004). Os princípios e snippets abaixo (Result,
> HttpError→AppError→QueryError, server functions, MVVM) **continuam válidos** — mudou a organização
> (split client/server, `view-model`/`controller`, Event Bus em `shared/bus`).

```
src/
├── features/<feature>/
│   ├── domain/            # puro: VOs branded, tipos, regras, errors. ZERO I/O/framework
│   │   ├── *.value-object.ts
│   │   ├── *.aggregate.ts
│   │   ├── *.errors.ts          # string-literal unions
│   │   └── *.repository.port.ts # contrato (type)
│   ├── application/       # use cases puros; ports como type
│   │   └── *.use-case.ts
│   ├── infrastructure/    # BFF: server functions, http clients, mappers, queryKeys
│   │   ├── *.server-fn.ts
│   │   ├── *.client.ts
│   │   ├── *.schema.ts          # Zod do response do backend
│   │   └── *.queries.ts         # queryKey factory + queryFn
│   └── ui/                # componentes + presenter hook
│       ├── *.component.tsx
│       └── *.presenter.hook.ts
├── server/                # cross-feature
│   ├── config/env.config.ts
│   ├── http/result-fetch.ts, map-to-server-response.ts
│   ├── auth/session-store.port.ts, oidc-client.ts, *.server-fn.ts
│   └── security/...
├── lib/                   # cross-cutting puro (sem framework)
│   ├── result.ts, brand.ts
│   └── http/http-error.types.ts, app-error.types.ts, map-to-app-error.ts, query-error.ts
└── components/ui/         # design system
```

**Regra de import:** `domain` não importa `application`/`infrastructure`/`ui`. Uma feature não importa outra (só via kernel compartilhado ou server function). Enforce com `eslint-plugin-import` `no-restricted-paths`.

---

## 1. Tipos-base

### `lib/result.ts`

```ts
export type Result<T, E> =
  | { readonly kind: "ok"; readonly value: T }
  | { readonly kind: "err"; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ kind: "ok", value });
export const err = <E>(error: E): Result<never, E> => ({ kind: "err", error });

export const isOk = <T, E>(
  r: Result<T, E>,
): r is { readonly kind: "ok"; readonly value: T } => r.kind === "ok";
export const isErr = <T, E>(
  r: Result<T, E>,
): r is { readonly kind: "err"; readonly error: E } => r.kind === "err";

export const map = <T, E, U>(r: Result<T, E>, f: (v: T) => U): Result<U, E> =>
  isOk(r) ? ok(f(r.value)) : r;
export const flatMap = <T, E, U, F>(
  r: Result<T, E>,
  f: (v: T) => Result<U, F>,
): Result<U, E | F> => (isOk(r) ? f(r.value) : r);
export const mapError = <T, E, F>(
  r: Result<T, E>,
  f: (e: E) => F,
): Result<T, F> => (isErr(r) ? err(f(r.error)) : r);
```

### `lib/brand.ts` + smart constructor

```ts
export type Brand<T, B extends string> = T & { readonly __brand: B };

// Exemplo de VO no domínio (estado inválido irrepresentável):
export type Email = Brand<string, "Email">;
export type EmailError = "empty" | "invalid-format";

export const Email = (raw: string): Result<Email, EmailError> => {
  const value = raw.trim();
  if (value === "") return err("empty");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return err("invalid-format");
  return ok(value as Email); // único lugar onde o cast é permitido: dentro do smart constructor
};
```

---

## 2. Camada HTTP / BFF

### `lib/http/http-error.types.ts` (transporte)

```ts
export type HttpError =
  | Readonly<{ kind: "network" }>
  | Readonly<{ kind: "http"; status: number; body: unknown }>
  | Readonly<{ kind: "parse" }>
  | Readonly<{ kind: "timeout" }>
  | Readonly<{ kind: "aborted" }>;
```

### `server/http/result-fetch.ts` (fetch → Result; sem throw)

```ts
import { ok, err, type Result } from "../../lib/result";
import type { HttpError } from "../../lib/http/http-error.types";

export interface ResultFetchOptions {
  method?: string;
  token?: string; // Bearer da sessão server-side
  body?: unknown;
  headers?: Readonly<Record<string, string>>;
  correlationId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
}

const safeReadBody = async (r: Response): Promise<unknown> => {
  const text = await r.text();
  if (text === "") return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export const resultFetch = async <T>(
  url: string,
  options: ResultFetchOptions = {},
): Promise<Result<T, HttpError>> => {
  const {
    method = "GET",
    token,
    body,
    headers = {},
    correlationId,
    signal,
    timeoutMs = 10_000,
  } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  if (signal) {
    if (signal.aborted) controller.abort();
    else
      signal.addEventListener("abort", () => controller.abort(), {
        once: true,
      });
  }
  const requestHeaders: Record<string, string> = {
    accept: "application/json",
    ...(body !== undefined ? { "content-type": "application/json" } : {}),
    ...(token !== undefined ? { authorization: `Bearer ${token}` } : {}),
    ...(correlationId !== undefined
      ? { "x-correlation-id": correlationId }
      : {}),
    ...headers,
  };
  let response: Response;
  try {
    response = await globalThis.fetch(url, {
      method,
      headers: requestHeaders,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    });
  } catch {
    clearTimeout(timeoutId);
    if (controller.signal.aborted)
      return err(
        signal?.aborted === true ? { kind: "aborted" } : { kind: "timeout" },
      );
    return err({ kind: "network" });
  }
  clearTimeout(timeoutId);
  if (!response.ok)
    return err({
      kind: "http",
      status: response.status,
      body: await safeReadBody(response),
    });
  if (response.status === 204) return ok(undefined as T);
  try {
    return ok((await response.json()) as T);
  } catch {
    return err({ kind: "parse" });
  }
};
```

### `server/http/map-to-server-response.ts` (preserva o status do upstream)

```ts
import type { HttpError } from "../../lib/http/http-error.types";

const JSON_HEADERS = { "content-type": "application/json" } as const;
const serializeBody = (b: unknown): string =>
  b === null || b === undefined
    ? ""
    : typeof b === "string"
      ? b
      : JSON.stringify(b);

export const mapToServerResponse = (error: HttpError): Response => {
  switch (error.kind) {
    case "http":
      return new Response(serializeBody(error.body), {
        status: error.status,
        headers: JSON_HEADERS,
      });
    case "network":
    case "timeout":
      return new Response(JSON.stringify({ kind: "connectivity" }), {
        status: 504,
        headers: JSON_HEADERS,
      });
    case "parse":
      return new Response(JSON.stringify({ kind: "bad-gateway" }), {
        status: 502,
        headers: JSON_HEADERS,
      });
    case "aborted":
      return new Response(null, { status: 499 });
    default: {
      const _: never = error;
      return _;
    }
  }
};
```

### `lib/http/app-error.types.ts` (semântica que a UI entende)

```ts
export type AppError =
  | Readonly<{ kind: "auth:expired" }>
  | Readonly<{ kind: "auth:forbidden" }>
  | Readonly<{ kind: "not-found" }>
  | Readonly<{ kind: "validation"; issues: readonly string[] }>
  | Readonly<{ kind: "conflict" }>
  | Readonly<{ kind: "server" }>
  | Readonly<{ kind: "connectivity" }>
  | Readonly<{ kind: "bad-gateway" }>
  | Readonly<{ kind: "unknown"; status?: number }>;
```

### `lib/http/map-to-app-error.ts`

```ts
import type { AppError } from "./app-error.types";
import type { HttpError } from "./http-error.types";

const issuesOf = (body: unknown): readonly string[] => {
  if (typeof body === "object" && body !== null && "issues" in body) {
    const { issues } = body;
    if (Array.isArray(issues)) {
      const s = issues.filter((i): i is string => typeof i === "string");
      if (s.length === issues.length) return s;
    }
  }
  return [];
};

export const mapToAppError = (e: HttpError): AppError => {
  switch (e.kind) {
    case "http":
      if (e.status === 401) return { kind: "auth:expired" };
      if (e.status === 403) return { kind: "auth:forbidden" };
      if (e.status === 404) return { kind: "not-found" };
      if (e.status === 409) return { kind: "conflict" };
      if (e.status === 400)
        return { kind: "validation", issues: issuesOf(e.body) };
      if (e.status >= 500) return { kind: "server" };
      return { kind: "unknown", status: e.status };
    case "network":
    case "timeout":
      return { kind: "connectivity" };
    case "parse":
      return { kind: "bad-gateway" };
    case "aborted":
      return { kind: "unknown" };
    default: {
      const _: never = e;
      return _;
    }
  }
};
```

### `lib/http/query-error.ts` (a ÚNICA Error subclass)

```ts
import type { AppError } from "./app-error.types";

export class QueryError extends Error {
  readonly appError: AppError;
  constructor(appError: AppError) {
    super(`[QueryError] ${appError.kind}`);
    this.name = "QueryError";
    this.appError = appError;
  }
}
export const isQueryError = (e: unknown): e is QueryError =>
  e instanceof QueryError;
```

> Exceção documentada ao "sem class/throw": só pra fazer a ponte entre `Result` e a API de erro do TanStack Query. Vive em `lib/http`, usada só por `queryFn`/`mutationFn`.

---

## 3. Server Function (BFF endpoint)

```ts
// features/resource/infrastructure/get-resource.server-fn.ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isErr } from "~/lib/result";
import { resultFetch } from "~/server/http/result-fetch";
import { mapToServerResponse } from "~/server/http/map-to-server-response";
import { env } from "~/server/config/env.config";
import { getSessionToken } from "~/server/auth/session.guard";

const InputSchema = z.object({ id: z.string().min(1) });
const ResourceSchema = z.object({ id: z.string(), name: z.string() }); // valida o response do backend

export const getResource = createServerFn({ method: "GET" })
  .inputValidator(InputSchema)
  .handler(async ({ data }) => {
    const token = await getSessionToken(); // cookie → sessão → token (server-side)
    const result = await resultFetch<unknown>(
      `${env.API_URL}/resources/${data.id}`,
      { token },
    );
    if (isErr(result)) throw mapToServerResponse(result.error); // preserva status ao client
    return ResourceSchema.parse(result.value); // boundary: backend pode mudar contrato
  });
```

## 4. Consumo no client

### queryKey factory + queryFn (`*.queries.ts`)

```ts
import { queryOptions } from "@tanstack/react-query";
import { QueryError } from "~/lib/http/query-error";
import { mapToAppError } from "~/lib/http/map-to-app-error";
import { getResource } from "./get-resource.server-fn";

export const resourceQueries = {
  all: ["resource"] as const,
  detail: (id: string) =>
    queryOptions({
      queryKey: [...resourceQueries.all, "detail", id],
      queryFn: async () => {
        // server fn devolve Response com status; se !ok, o client recebe o erro HTTP:
        try {
          return await getResource({ data: { id } });
        } catch (e) {
          if (e instanceof Response)
            throw new QueryError(
              mapToAppError({
                kind: "http",
                status: e.status,
                body: await e.json().catch(() => null),
              }),
            );
          throw e;
        }
      },
    }),
};
```

### presenter hook (liga estado → ViewModel)

```ts
// features/resource/ui/use-resource-detail.presenter.hook.ts
import { useQuery } from "@tanstack/react-query";
import { resourceQueries } from "../infrastructure/resource.queries";

export const useResourceDetail = (id: string) => {
  const query = useQuery(resourceQueries.detail(id));
  return {
    isLoading: query.isPending,
    resource: query.data,
    error: query.error, // QueryError → AppError
  };
};
```

### componente (switch exaustivo no AppError → i18n)

```tsx
export function ResourceDetail({ id }: { id: string }) {
  const { isLoading, resource, error } = useResourceDetail(id);
  if (isLoading) return <Spinner />;
  if (error) return <AppErrorView error={error} />; // switch sobre error.appError.kind → label
  return <ResourceCard resource={resource!} />;
}
```

### 401 → signOut automático + invalidação (no QueryClient)

```ts
new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (isQueryError(error) && error.appError.kind === "auth:expired") {
        queryClient.clear();
        router.navigate({
          to: "/auth/login",
          search: { redirect: location.pathname },
        });
      }
    },
  }),
  mutationCache: new MutationCache({
    onSuccess: () => queryClient.invalidateQueries(), // re-sincroniza após mutation
  }),
});
```

---

## 5. Estado: dois tipos, nunca misturar

| Tipo                         | Ferramenta                          |
| ---------------------------- | ----------------------------------- |
| Server state (dados remotos) | TanStack Query (cache client-only)  |
| UI state (efêmero)           | `useReducer` + state machine tagged |

### State machine tagged (mini)

```ts
type WizardState =
  | {
      readonly kind: "Editing";
      readonly step: number;
      readonly data: Partial<FormData>;
    }
  | { readonly kind: "Submitting"; readonly data: FormData }
  | { readonly kind: "Submitted"; readonly id: string }
  | { readonly kind: "Failed"; readonly error: AppError };

type WizardEvent =
  | { readonly type: "next"; readonly patch: Partial<FormData> }
  | { readonly type: "submit" }
  | { readonly type: "ok"; readonly id: string }
  | { readonly type: "fail"; readonly error: AppError };

const reducer = (state: WizardState, event: WizardEvent): WizardState => {
  switch (state.kind) {
    case "Editing":
      if (event.type === "next")
        return {
          ...state,
          step: state.step + 1,
          data: { ...state.data, ...event.patch },
        };
      if (event.type === "submit")
        return { kind: "Submitting", data: state.data as FormData };
      return state;
    case "Submitting":
      if (event.type === "ok") return { kind: "Submitted", id: event.id };
      if (event.type === "fail") return { kind: "Failed", error: event.error };
      return state;
    default:
      return state;
  }
};
```

---

## 6. Auth / sessão (BFF resolve; browser não vê token)

```
Browser ──cookie HttpOnly (__Host-session = id opaco)──► BFF ──Bearer JWT──► API
```

- Login OIDC (Authorization Code + PKCE) no BFF: `/auth/login` → IdP → `/auth/callback` cria sessão server-side, seta cookie.
- Tokens/refresh/secret/URL do backend **nunca** vão ao browser. Cookie carrega só o id; tokens vivem num `SessionStore` (port + adapter: in-memory dev → Redis prod).
- CSRF: `SameSite=Strict` + validação `Sec-Fetch-Site`/`Origin` (nativa no TanStack Start via `createCsrfMiddleware`).
- Security headers (CSP nonce, HSTS, nosniff, frame-deny) via global middleware (`src/start.ts` + `createStart`).

---

## 7. A cadeia de erro (fim a fim)

```
API 4xx/5xx
  → resultFetch → Result.err(HttpError)              [server, sem throw]
  → mapToServerResponse → Response (status preservado) [server]
  → queryFn → throw QueryError(mapToAppError(...))     [client boundary]
  → TanStack Query (queryCache/mutationCache.onError)
  → switch exaustivo em AppError.kind → label i18n     [ui]
```

A UI **nunca** olha status HTTP — só `AppError` semântico. 401 → signOut. Stack trace nunca chega ao usuário.

---

## 8. Convenções

- **Naming:** postfix por tipo de arquivo (`.value-object.ts`, `.server-fn.ts`, `.component.tsx`, `.presenter.hook.ts`, `.queries.ts`, `.schema.ts`). Mirror `src/` → `tests/`.
- **Idioma:** código EN; UI strings via i18n; erros internos = literals kebab-case EN (`'not-found'`).
- **Runner híbrido:** `node:test` para puro (domain/lib/server), Vitest para DOM. ⚠️ alias `~/` resolve só no bundler — código testado por `node:test` usa imports relativos.
- **Validação na fronteira:** Zod no input (server fn) E no response do backend (`*.schema.ts`).

## 9. Checklist de adoção

- [ ] `Result<T,E>` + `Brand` + smart constructors no `lib/`/`domain/`.
- [ ] `resultFetch` + `HttpError` + `mapToServerResponse` (server) e `AppError` + `mapToAppError` + `QueryError` (client).
- [ ] Boundaries de import enforçadas no ESLint.
- [ ] TanStack Query com `queryCache.onError` (401→signOut) e `mutationCache.onSuccess` (invalidação).
- [ ] Auth no BFF (cookie HttpOnly, SessionStore port, token nunca no browser).
- [ ] Security: CSRF/Sec-Fetch + CSP/HSTS via global middleware.
- [ ] Server-state (Query) ≠ UI-state (reducer/state machine).
- [ ] Strict TS, sem `class`/`throw`/`any` fora da borda; switch exaustivo com guarda `never`.

```

```
