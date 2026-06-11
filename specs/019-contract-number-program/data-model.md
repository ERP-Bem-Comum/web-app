# Data Model — 019 contract-number-program (client model)

Mudanças no `src/modules/contracts/client/data/model/contracts.model.ts` (e espelho no controller/CreateContractInput). Apenas o que muda.

## `ContractSchema` (leitura) — antes → depois

| Campo | Antes | Depois | Origem (#32) |
|---|---|---|---|
| `sequentialNumber` | `string` | `string` (inalterado) | gerado pelo backend |
| `classification` | `enum('Contract','ServiceOrder')` | **mantém** (mapeado de CT/OS no BFF) | `classification: 'CT'\|'OS'` |
| `programId` | `number?` | **`string?`** (UUID) | `programId: string\|null` |
| `program` | `{ id: number, name: string }?` | **`{ id: string, name: string }?`** | bloco `program` (id + sigla) |
| `budgetPlanId` | `number?` | **`string?`** (UUID) | `budgetPlanId: string\|null` |
| `budgetPlan` | `{ id: number, ... }?` | **`{ id: string, ... }?`** | (bloco se existir; senão só id) |
| `categorizacao` | `enum(...)` | **`string?`** (livre) | `categorizacao: string\|null` |
| `centroDeCusto` | `enum(...)` | **`string?`** (livre) | `centroDeCusto: string\|null` |

> `ContractStatusSchema` (domínio) permanece `Pendente/Em Andamento/Finalizado/Distrato` nesta fatia. **D9**: o schema de **resposta do BFF** ganha branch de escape (`status: z.string()`) para não quebrar com `'Cancelled'` (#32); o **mapper degrada** status desconhecido de forma segura (não zera a linha) — a UI/fluxo de cancelamento fica para slice futuro.

## `CreateContractInputSchema` (escrita) — depois
- `classification`: `'Contract'|'ServiceOrder'` (mapeado para CT/OS no BFF; **não** envia número).
- `programId?`: `string` (UUID) · `budgetPlanId?`: `string` (UUID, opcional nesta fatia).
- `categorizacao?`/`centroDeCusto?`: `string`.
- **Removido do envio**: `sequentialNumber` (não existe mais no body).

## `ContractFormState` (controller) — depois
- `programId: string | null` · `budgetPlanId: string | null`
- `categorizacao: string | null` · `centroDeCusto: string | null`
- `classification: 'Contract' | 'ServiceOrder'` (inalterado)

## BFF response schema (`contracts.schema.ts`) — adicionar ao base/list-item + detalhe
```
classification: z.enum(['CT','OS']).nullable().optional()
program: z.object({ id: z.string(), <sigla>: z.string() }).nullable().optional()
programId: z.string().nullable().optional()
budgetPlanId: z.string().nullable().optional()
categorizacao: z.string().nullable().optional()
centroDeCusto: z.string().nullable().optional()
```
(nomes exatos casados com `contract-dto.ts` do #32 no implement)

## Mapper (`core-api-contracts.ts`) — `apiContractToDomain`
- `classification`: `dto.classification === 'OS' ? 'ServiceOrder' : 'Contract'` (default Contract quando ausente).
- `program`: `dto.program ? { id: dto.program.id, name: dto.program.<sigla> } : undefined`.
- `programId/budgetPlanId/categorizacao/centroDeCusto`: `dto.x ?? undefined`.
- **create body**: `classification: input.classification === 'ServiceOrder' ? 'OS' : 'CT'`; sem `sequentialNumber`.
