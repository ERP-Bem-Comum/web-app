---
name: react-query-fetch-expert
description: >
  Especialista em HTTP + estado de servidor no `erp-financeiro-frontend`.
  Cobre o wrapper de `fetch` em `src/services/http-client.ts` (substituiu Axios),
  as 3 instâncias `api`/`apiOptions`/`apiShared`, padrão "um service por
  recurso" + hooks de domínio com `@tanstack/react-query` 5 + invalidações.
  Trata FormData, blob, validateStatus, 401 → signOut, error narrowing via
  `isHttpError`. Use sempre que envolver: novo endpoint, queryKey, mutation,
  invalidação, header customizado, upload, download, ou erro de chamada HTTP.
---

# react-query-fetch-expert

Especialista em **HTTP via fetch + React Query 5** no `erp-financeiro-frontend`. Roteador: [`frontend-orchestrator`](./frontend-orchestrator.md).

> **Axios saiu.** Tudo passa por `src/services/http-client.ts` (wrapper sobre `fetch`).

---

## Versões fixadas

| Pacote | Versão |
| --- | --- |
| `@tanstack/react-query` | `5.100.11` |
| `@tanstack/react-query-devtools` | `5.100.11` |
| Cliente HTTP | `src/services/http-client.ts` (próprio, sobre `fetch` nativo) |

---

## A pilha em uma frase

> **Service** chama o **client** (`api`/`apiOptions`/`apiShared`), devolve `Promise<T>`. **Hook** orquestra `useQuery`/`useMutation`, gerencia loading/error e invalida queries afins. **Componente** consome o hook.

```
Component  ──uses──►  Hook (useGetX / useCreateX)
                          │
                          ├─ React Query (cache + invalidação)
                          │
                          └─ Service (foo.ts)  ──uses──►  api (http-client)  ──►  fetch
```

---

## `src/services/http-client.ts` — API resumida

```ts
import { createHttpClient, isHttpError, type HttpResponse } from '@/services/http-client'

const client = createHttpClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  onRequest: async (init) => {
    /* inject Bearer/Basic */
    return init
  },
  onUnauthorized: (error) => {
    /* signOut ou destroyCookie */
  },
})

// Métodos
client.get<T>(url, config?)
client.post<T>(url, body?, config?)
client.put<T>(url, body?, config?)
client.patch<T>(url, body?, config?)
client.delete<T>(url, config?)
```

### `HttpRequestConfig`

| Campo | Tipo | Quando usar |
| --- | --- | --- |
| `params` | `Record<string, unknown>` | query string. Arrays viram repetições do mesmo key. `undefined`/`null` são omitidos |
| `headers` | `Record<string, string>` | merge com `onRequest` |
| `responseType` | `'json' \| 'blob' \| 'text' \| 'arraybuffer'` | default tenta JSON, cai pra text |
| `signal` | `AbortSignal` | cancelar request |
| `validateStatus` | `(status: number) => boolean` | desligar throw em status específicos (ex.: `() => true`) |

### `HttpResponse<T>` — shape

```ts
{ data: T; status: number; statusText: string; headers: Record<string, string> }
```

### `HttpError`

- Tem `.response: { status, statusText, data, headers } | undefined` (undefined = falha de rede)
- Narrow: `if (isHttpError(e)) { ... }`
- Status code constants em `import { HttpStatusCode } from '@/services/http-status'` (drop-in do antigo enum axios)

### FormData

Se passar `Content-Type: 'multipart/form-data'` em `headers` e o body for objeto, o wrapper monta o `FormData` automaticamente (incluindo `File`/`Blob`/arrays) e remove o `Content-Type` para o browser definir o boundary.

```ts
await api.post('/upload', { file, name: 'foo' }, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
```

---

## As 3 instâncias prontas

| Arquivo | Auth | Quando usar |
| --- | --- | --- |
| `src/services/api.ts` | Bearer via `getSession()` do NextAuth | Toda chamada autenticada do app principal |
| `src/services/apiOptions.ts` | Bearer (NextAuth) **ou** Basic via cookies `ApprovalsPayableId`+`ApprovalsPassword` | Fluxo de aprovação externa (`/aprovar/...`) |
| `src/services/apiShared.ts` | Basic via cookies `shareUsername`+`sharePassword` | Visualização compartilhada (`/consolidado-compartilhado`, `/plano-orcamentario-compartilhado`) |

Cada um já tem `onRequest` e `onUnauthorized` configurados. **Não crie nova instância** sem necessidade real — geralmente é só importar o `api` existente.

---

## Padrão "service por recurso"

Para criar serviço de recurso `Foo` (ver skill [`frontend-feature-module`](../skills/frontend-feature-module/SKILL.md)):

```ts
// src/services/foo.ts
import { Response } from '@/types/global'
import { Foo, ParamsFoo, FooRow } from '@/types/foo'
import { handleError } from '@/utils/errorHandling'
import { flattenParams } from '@/utils/flattenParams'
import { HttpStatusCode } from '@/services/http-status'
import { queryClient } from 'lib/react-query'
import api from './api'

export const getAllFoo = async (params: ParamsFoo): Promise<Response<FooRow[]>> => {
  try {
    const resp = await api.get('/foo', { params: flattenParams(params) })
    return {
      status: resp.status,
      data: resp.data.items,
      error: '',
      meta: resp.data.meta,
    }
  } catch (error) {
    console.error(error)
    return handleError<FooRow[]>(error)
  }
}

export const createFoo = async (foo: Foo): Promise<Response<boolean>> => {
  try {
    const resp = await api.post('/foo', foo)
    queryClient.invalidateQueries({ queryKey: ['foo'] })
    return {
      status: resp.status,
      data: resp.status === HttpStatusCode.Created,
      error: '',
      meta: null,
    }
  } catch (error) {
    console.error(error)
    return handleError<boolean>(error)
  }
}
```

Pontos canônicos:

- **try/catch + `handleError`** — toda função externa devolve `Response<T>` (de `@/types/global`), nunca propaga exception.
- **`flattenParams`** (`@/utils/flattenParams`) — serializa objetos nested para query string flat.
- **`queryClient.invalidateQueries`** dentro da mutation, depois de sucesso.
- **`HttpStatusCode.Created` / `.Ok`** — sem hardcoded `200`/`201` espalhado.

---

## Padrão "hook de domínio"

```ts
// src/hooks/useFoo.ts
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getAllFoo, getFooById } from '@/services/foo'
import { ParamsFoo } from '@/types/foo'

export const useGetAllFoo = (params: ParamsFoo) => {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['foo', params],
    queryFn: () => getAllFoo(params),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
  })
  return { data, isLoading, isRefetching, error, refetch }
}

export const useGetFooById = (id: number | null) => {
  return useQuery({
    queryKey: ['fooById', id],
    queryFn: () => getFooById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
  })
}
```

Padrões aplicados no projeto inteiro:

- `staleTime` e `gcTime` em `5min` (`1000*60*5`).
- `refetchOnWindowFocus: false`, `refetchOnMount: true`.
- `placeholderData: keepPreviousData` para paginação suave.
- `enabled: !!id` para queries dependentes.
- `queryKey` sempre array; primeiro item é o nome do recurso.

---

## Mutations

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFoo } from '@/services/foo'

export const useCreateFoo = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createFoo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foo'] })
    },
  })
}
```

**Não duplicar `invalidateQueries`** entre `useMutation.onSuccess` e o service. Se o service já invalida (padrão atual no projeto), o `onSuccess` no hook não precisa.

---

## Tratamento de erro

```ts
import { handleError } from '@/utils/errorHandling'
// internamente usa isHttpError do http-client
```

`handleError<T>(error)` retorna `Response<T>` com:
- `status: error.response?.status ?? 500`
- `error: error.response?.data?.message ?? 'An unknown error occurred'`

**Não capture exception em componente** — capture no service e devolva `Response<T>`. Componente lê `data.error` se `data.error !== ''`.

---

## Casos especiais

### Download de blob (CSV/PDF)

```ts
const resp = await api.get<Blob>('/foo/csv', {
  params: flattenParams(params),
  responseType: 'blob',
})
saveBlob(resp.data, 'foo.csv')   // de '@/utils/saveBlob'
```

### Headers de resposta (filename de Content-Disposition)

```ts
import { getFileNameFromHeader } from '@/utils/getFileName'

const resp = await api.get<Blob>('/foo/export', { responseType: 'blob' })
const { blob, filename } = getFileNameFromHeader({ headers: resp.headers, data: resp.data })
saveBlob(blob, filename)
```

### Resposta multipart pode ser JSON ou Blob (ex.: import com erros)

```ts
const response = await api.post('/import', { file }, {
  headers: { 'Content-Type': 'multipart/form-data' },
  validateStatus: () => true,    // não throw em 4xx
})
// inspecionar response.status + response.data
```

### Cancelamento

```ts
const ac = new AbortController()
api.get('/long', { signal: ac.signal })
// later:
ac.abort()
```

---

## Anti-padrões

1. **`import axios from 'axios'`** — não. Use `api` de `@/services/api`.
2. **`fetch` direto em Client Component** — passe pelo wrapper para herdar auth + 401 handling.
3. **`throw` em service** — sempre `try/catch` → `Response<T>` via `handleError`.
4. **`queryKey` string** (`'foo'`) — sempre array (`['foo']` ou `['foo', params]`).
5. **`gcTime` curto demais** — padrão é 5min; reduzir só com motivo.
6. **`invalidateQueries` em 2 lugares** (service + hook) — escolha um.
7. **`useQuery` dentro de loop ou condicional** — use `enabled` em vez disso.
8. **Hardcoded `200`/`201`** — use `HttpStatusCode.Ok`/`.Created`.

---

## Heurísticas

- **Lista vazia/loading mostra "undefined"** → desestruture com default: `const { data = { items: [] } } = useGetAllFoo(...)`.
- **Mutation invalidou mas UI não atualizou** → confira se `queryKey` da query bate exatamente com o `invalidateQueries`.
- **Auto-logout em hora errada** → confira backend retorna `{ message: 'Unauthorized' }` (case-sensitive) em 401.
- **Request duplicada** → React Query 5 deduplica por queryKey; conferir se há dois hooks com keys diferentes para o mesmo dado.
- **FormData não enviando** → confirme que `headers: { 'Content-Type': 'multipart/form-data' }` está no config (gatilho do auto-FormData no wrapper).

---

## Saída esperada

1. Resumo de 2-3 frases.
2. Service novo no padrão do recurso vizinho.
3. Hook companheiro em `src/hooks/useFoo.ts`.
4. `pnpm build` verde.

---

## Changelog

- **2026-05-20:** Criação. Substitui a antiga camada Axios pelo `http-client.ts` (fetch).
