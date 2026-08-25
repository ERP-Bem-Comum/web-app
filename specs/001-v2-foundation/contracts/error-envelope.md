# Contract — Envelope de Erro (core-api → AppError)

## Envelope real do core-api (todo 4xx/5xx)

```json
{ "error": { "code": "string-kebab-case", "message": "string", "requestId": "string (opcional)" } }
```

- **Sem** `issues[]` / `errors[]`. Validação (400) colapsa para `code: "validation"`, sem detalhe por campo.
- Erros de domínio: `code` e `message` recebem **ambos** o slug (ex.: `invalid-credentials`).
- **Fonte**: `core-api/src/shared/http/errors.ts:19-35`, `reply.ts:31-37`.

### ⚠️ `requestId` é OPCIONAL (corrigido em 24/08/2026)

O core-api monta o envelope por **dois** caminhos: o normal (`toErrorEnvelope`, que carimba o
`requestId`) e **guardas de rota que o montam à mão e o omitem** — por exemplo a que recusa a geração
de remessa sob `AUTH_RBAC_MODE=bypass` (`financial/adapters/http/plugin.ts:407`), que responde 503 com
a mensagem exata do bloqueio.

Enquanto o `parseErrorEnvelope` exigia `requestId`, esses envelopes não parseavam, a `message` era
descartada inteira e a tela caía no genérico "Algo deu errado" — com a frase certa dentro da resposta
HTTP. Hoje `code` e `message` são obrigatórios e `requestId` degrada para `null`; ele serve à
observabilidade e **nenhum dos ~20 chamadores o lê**, então não pode ser pré-requisito para entregar o
campo que fala com o humano.

## Mapeamento `HttpError → AppError` (por STATUS — `map-to-app-error.ts`)

| Upstream  | HttpError           | AppError                   | Observação                                           |
| --------- | ------------------- | -------------------------- | ---------------------------------------------------- |
| 401       | `http(401)`         | `auth:expired`             | dispara signOut no QueryClient                       |
| 403       | `http(403)`         | `auth:forbidden`           | `user-disabled` etc.                                 |
| 404       | `http(404)`         | `not-found`                | rota (`not-found`) ou recurso (`contract-not-found`) |
| 409       | `http(409)`         | `conflict`                 | `email-already-registered`                           |
| 400       | `http(400)`         | `validation` (issues `[]`) | backend não detalha; issues preenchidas pelo BFF/Zod |
| ≥500      | `http(5xx)`         | `server`                   | `internal`                                           |
| outro 4xx | `http(4xx)`         | `unknown` (status)         | `request-error`                                      |
| —         | `network`/`timeout` | `connectivity`             |                                                      |
| —         | `parse`             | `bad-gateway`              |                                                      |
| —         | `aborted`           | `unknown`                  |                                                      |

> `code`/`message`/`requestId` do envelope são extraídos (via `parseErrorEnvelope`) para
> observabilidade/log, mas a discriminação do `AppError` é por **status** (mais estável que slug).

## Mapeamento `HttpError → Response` (server, preserva status — `map-to-server-response.ts`)

| HttpError             | Response                         |
| --------------------- | -------------------------------- |
| `http`                | status original + body original  |
| `network` / `timeout` | `504` `{ kind: 'connectivity' }` |
| `parse`               | `502` `{ kind: 'bad-gateway' }`  |
| `aborted`             | `499` (sem corpo)                |
