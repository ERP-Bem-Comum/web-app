# Data Model: Distrato aderente ao #32

Feature frontend-only. Sem entidade nova de domínio nem migration. O que muda são **inputs de borda** (server fn / use-case) e a **união de erros**. Tudo `Readonly`/imutável.

## Inputs novos / alterados

### `EndContractInput` (NOVO — input da server fn `end-contract`)
Espelhado por Zod em `contracts.schemas.ts` (`EndContractInputSchema`) e por tipo em `contracts.types.ts` (drift guard `AssertEqual`).

| Campo | Tipo | Regra (borda) | Origem (UI) |
|---|---|---|---|
| `contractId` | `string` (uuid) | `z.uuid()` | rota/detalhe |
| `fileBase64` | `string` | `min(1)` (PDF do distrato, base64) | o mesmo PDF anexado ao aditivo de distrato |
| `fileName` | `string` | `min(1).max(255)`, regex sem separadores de path | nome do arquivo anexado |
| `terminatedAt` | `string` | `min(1)`; **data válida e não-futura** (via `validateSignedDocument`) | `terminationDate` (create) ou `signedAt` (attach) — `YYYY-MM-DD` |
| `reason` | `string` | `trim().min(1)` (motivo não-vazio) | `description` do aditivo de distrato |

> Nota: a query de upload de **documento de contrato** não exige `signedAt` (confirmado no #32), então `EndContractInput` **não** carrega `signedAt` separado — `terminatedAt` é a data relevante.

### `CreateAmendmentInput` / `AmendmentFormState` (regra reforçada — sem mudança de tipo)
- Quando `type === 'distrato'`: `description` (→ reason) e `terminationDate` (→ terminatedAt) passam a ser **obrigatórios** no `canSubmit`/controller. Sem mudança estrutural de tipo — só validação.

## União de erros (alteração)

### `ContractsError` (em `server/domain/contracts.types.ts`)
Acrescenta dois membros (discriminated union de string literais; `switch` exaustivo no error-tag com guard `never`):

```
| 'terminate-no-document'   // 422 terminate-no-signed-document — distrato sem documento assinado
| 'terminate-invalid-date'  // 422 terminate-invalid-date — data efetiva ausente/inválida/futura
```

### Mapeamentos
| core-api (`error.code`) | HTTP | `ContractsError` | tag i18n |
|---|---|---|---|
| `terminate-no-signed-document` | 422 | `terminate-no-document` | `contracts.distrato.error.no-document` |
| `terminate-invalid-date` | 422 | `terminate-invalid-date` | `contracts.distrato.error.invalid-date` |
| `ContractNotActive` | 409 | `contract-not-active` (já existe) | `contracts.error.contract-not-active` |
| 400 (Zod body) sem slug conhecido | 400 | `server` (fallback) | `contracts.error.unexpected` |
| validação de borda (PDF/data) | — | `invalid-pdf` / `file-too-large` / `terminate-invalid-date` | tags existentes/novas |

## Transição de estado (resultado)

```
Contrato (Em Andamento / Active)
   │  distrato: upload(signed_termination) → POST /end {Terminate, terminatedAt, reason}
   ▼
Contrato (Distrato / Terminated)   endedAt = terminatedAt (data efetiva)
```

Refletido no detalhe (badge `Distrato`) e no grid via `statusApiToDomain('Terminated') → 'Distrato'` (já existente) após invalidação de `['contracts','detail',id]` + `['contracts','list']` (já feita no `end-contract.binding`).

## Invariantes preservadas
- Sem `any`/`class`/`throw` fora da borda; `Result<T,E>` ponta a ponta.
- Zod valida o input da server fn e o response do core-api (schemas existentes).
- Token só server-side; nada novo no bundle do client.
