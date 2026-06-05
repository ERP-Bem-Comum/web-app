# Contract — Envelope de Erro (core-api → AppError)

## Envelope real do core-api (todo 4xx/5xx)

```json
{ "error": { "code": "string-kebab-case", "message": "string", "requestId": "string" } }
```

- **Sem** `issues[]` / `errors[]`. Validação (400) colapsa para `code: "validation"`, sem detalhe por campo.
- Erros de domínio: `code` e `message` recebem **ambos** o slug (ex.: `invalid-credentials`).
- **Fonte**: `core-api/src/shared/http/errors.ts:19-35`, `reply.ts:31-37`.

## Mapeamento `HttpError → AppError` (por STATUS — `map-to-app-error.ts`)

| Upstream | HttpError | AppError | Observação |
|----------|-----------|----------|------------|
| 401 | `http(401)` | `auth:expired` | dispara signOut no QueryClient |
| 403 | `http(403)` | `auth:forbidden` | `user-disabled` etc. |
| 404 | `http(404)` | `not-found` | rota (`not-found`) ou recurso (`contract-not-found`) |
| 409 | `http(409)` | `conflict` | `email-already-registered` |
| 400 | `http(400)` | `validation` (issues `[]`) | backend não detalha; issues preenchidas pelo BFF/Zod |
| ≥500 | `http(5xx)` | `server` | `internal` |
| outro 4xx | `http(4xx)` | `unknown` (status) | `request-error` |
| — | `network`/`timeout` | `connectivity` | |
| — | `parse` | `bad-gateway` | |
| — | `aborted` | `unknown` | |

> `code`/`message`/`requestId` do envelope são extraídos (via `parseErrorEnvelope`) para
> observabilidade/log, mas a discriminação do `AppError` é por **status** (mais estável que slug).

## Mapeamento `HttpError → Response` (server, preserva status — `map-to-server-response.ts`)

| HttpError | Response |
|-----------|----------|
| `http` | status original + body original |
| `network` / `timeout` | `504` `{ kind: 'connectivity' }` |
| `parse` | `502` `{ kind: 'bad-gateway' }` |
| `aborted` | `499` (sem corpo) |
