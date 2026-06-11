# Contrato Client ↔ BFF — Colaboradores (REUSO, nada novo no servidor)

O client consome as **server functions já existentes** em
`src/modules/partners/server/adapters/server-fns/collaborator/`. Nenhuma é criada/alterada.

| Server fn | Método | Input (schema em `collaborator.io.ts`) | Uso no client |
|---|---|---|---|
| `listCollaboratorsFn` | GET | `ListCollaboratorsInput` (search, active, status, occupationAreas[], employmentRelationships[], roles[], yearOfContract, page, limit) | lista + filtros + paginação |
| `getCollaboratorFn` | GET | `GetCollaboratorInput` (`id`) | detalhe / editar |
| `createCollaboratorFn` | POST | `CreateCollaboratorInput` (7 campos essenciais) | pré-cadastro |
| `completeCollaboratorRegistrationFn` | POST | `CompleteCollaboratorRegistrationInput` (`id` + dados pessoais opcionais) | completar → `Cadastrado` |
| `updateCollaboratorFn` | POST | (campos editáveis) | editar |
| `deactivateCollaboratorFn` | POST | (`id` + `reason`) | desativar com Motivo |
| `reactivateCollaboratorFn` | POST | (`id`) | reativar inativo |
| `importCollaboratorsFn` | POST | CSV como string (≤ 2 MiB) | import em lote |

## RBAC
- `collaborator:read` — todas as leituras (lista/detalhe) e visibilidade do menu.
- `collaborator:write` — create/complete/update/deactivate/reactivate/import. Sem ela, ações ocultas/desabilitadas.
- Enforçado no **servidor** (já existe); o client apenas reflete (UX).

## Erros
Cadeia padrão da v2: core-api 4xx/5xx → `Result.err(HttpError)` → `mapToServerResponse` → `queryFn`
lança `QueryError(mapToAppError)` → `switch` exaustivo em `AppError.kind` → tag i18n. UI nunca olha status HTTP.
