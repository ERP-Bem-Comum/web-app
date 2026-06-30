# Data Model: avaliação de fornecedor (§1.6) + cancelamento (§1.7)

Frontend-only. Sem migration. Tudo `Readonly`/imutável.

## US1 — Fornecedor

### Tipo novo (`supplier.types.ts` server + `supplier.model.ts` client)
```ts
export const SERVICE_RATINGS = ['RUIM', 'REGULAR', 'BOM', 'OTIMO'] as const
export type ServiceRating = (typeof SERVICE_RATINGS)[number]
```

### `CreateSupplierInput` / `SupplierDetail` (+2 campos)
| Campo | Tipo | Regra |
|---|---|---|
| `serviceRating` | `ServiceRating \| null` | opcional; null = sem avaliação |
| `ratingComment` | `string \| null` | opcional |

- **Zod input** (`supplier.io-schemas.ts`): `serviceRating: z.enum(SERVICE_RATINGS).nullable().default(null)`, `ratingComment: z.string().trim().max(N).nullable().default(null)` + drift guard.
- **Response** (`supplier.schema.ts`): `serviceRating: z.string().nullable()`, `ratingComment: z.string().nullable()`. Mapeador `detailToModel`/`itemToModel`: `string → ServiceRating | null` **tolerante** (desconhecido → null).
- **toWriteBody**: envia os 2 campos (null quando vazio).

### i18n
`partners.suppliers.rating.{RUIM,REGULAR,BOM,OTIMO}` + opção "Sem avaliação".

## US2 — Contrato (status `Cancelado`)

### `ContractStatus` (+1 membro) — em 3 pontos
```
'Pendente' | 'Em Andamento' | 'Finalizado' | 'Distrato' | 'Cancelado'
```
- `server/domain/contracts.types.ts` (union) · `client/data/model/contracts.model.ts` (z.enum) · `server/adapters/contracts.schemas.ts` (z.enum).

### Mapeamento de status (core-api-contracts)
| API | Domínio |
|---|---|
| Pending | Pendente |
| Active | Em Andamento |
| Expired | Finalizado |
| Terminated | Distrato |
| **Cancelled** | **Cancelado** (novo; era fallback 'Finalizado') |

`statusDomainToApi`: Cancelado → 'Cancelled'.

### Switches/Records a atualizar (guard `never` aponta cada um)
- `contract-detail.page.tsx` `STATUS_BADGE_CLASS` + `contract-detail.css.ts` (classe `statusBadgeCancelled` via token).
- `contract-row.component.tsx`, `contract-status-chips.component.tsx`, `client/data/contract-list-filters.schema.ts`.
- (Legado `client/domain/status.ts` já tem 'cancelado' — sem mudança.)

### `ContractsError` (+1) + mapeamento
```
| 'contract-not-pending'   // 409 ContractNotPending / contract-not-pending
```
| code (core-api) | HTTP | ContractsError | tag |
|---|---|---|---|
| `ContractNotPending` / `contract-not-pending` | 409 | `contract-not-pending` | `contracts.error.contract-not-pending` |

### Gating (UI + helper puro)
`canCancelContract(status: ContractStatus): boolean = status === 'Pendente'`. A ação "cancelar" só aparece/habilita quando true.

### i18n
`contracts.cancel.{title,body,confirm,cancel}` (a modal vira "cancelar") + `contracts.error.contract-not-pending` + label de status `Cancelado`.

## Invariantes preservadas
Result ponta a ponta; sem any/throw fora da borda; Zod na borda (input+response) + drift guards; i18n; views burras; switch exaustivo `never` (o `Cancelado` força completude); naming postfix.
