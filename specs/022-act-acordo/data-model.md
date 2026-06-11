# Data Model: ACT — Acordo de Cooperação Técnica

Feature frontend-only. Sem migration. Reescreve o modelo de I/O do recurso ACT (de pessoa-física → Acordo institucional) e acrescenta erros. Tudo `Readonly`/imutável.

## Tipos (server domain `act/act.types.ts` + espelho client `act.model.ts`)

```ts
export const OCCUPATION_AREAS = ['PARC', 'DDI', 'DCE', 'EPV'] as const   // MANTER (collaborator tem cópia própria)
export type OccupationArea = (typeof OCCUPATION_AREAS)[number]

export const PIX_KEY_TYPES = ['cpf', 'cnpj', 'email', 'phone', 'random-key'] as const
export type PixKeyType = (typeof PIX_KEY_TYPES)[number]

export type BankAccount = Readonly<{ bank: string; agency: string; accountNumber: string; checkDigit: string }>
export type PixKey = Readonly<{ keyType: PixKeyType; key: string }>

// REMOVER: RegistrationStatus, EmploymentRelationship, e os campos cpf/role/startOfContract.
// Situação do Acordo = `active: boolean` (alinha ao actDetailSchema do #32). Rótulo (Ativo/Inativo)
// é derivado no view-model — NÃO reintroduzir o par 'active'|'inactive'.
```

## Inputs (server `act.io.ts` + client `act.model.ts`)

### `CreateActInput`
| Campo | Tipo | Regra (borda + UI) |
|---|---|---|
| `actNumber` | string | obrigatório (único — 409 no backend) |
| `name` | string | obrigatório (objeto do acordo) |
| `email` | string (email) | obrigatório, formato |
| `cnpj` | string | 14 dígitos (só-dígitos no wire); DV validado no backend (422) |
| `corporateName` | string | obrigatório (razão social) |
| `fantasyName` | string | obrigatório (nome fantasia/sigla) |
| `occupationArea` | OccupationArea | enum PARC/DDI/DCE/EPV |
| `legalRepresentative` | string | obrigatório (representante legal) |
| `startDate` | string (YYYY-MM-DD) | obrigatório |
| `endDate` | string (YYYY-MM-DD) | obrigatório; **> startDate** (igual/antes → inválido) |
| `hasFinancialTransfer` | boolean | toggle |
| `bankAccount` | BankAccount \| null | exigido (com pixKey OU) quando `hasFinancialTransfer` |
| `pixKey` | PixKey \| null | idem |

Regra de repasse (UI bloqueia + Zod `.superRefine` + backend 422): `hasFinancialTransfer === true ⇒ bankAccount != null || pixKey != null`.

### `UpdateActInput = CreateActInput & { id: string }`

## Output (server `ActDetail` / `ActListItem`; response Zod `act.schema.ts`)

### `ActDetail` (GET /acts/:id)
Todos os campos do input **+**: `id` (uuid), `legacyId` (number|null), `active` (boolean), `createdAt` (string), `updatedAt` (string).

### `ActListItem` (GET /acts items)
Subconjunto p/ a tabela: `id, actNumber, name, corporateName, fantasyName, occupationArea, hasFinancialTransfer, active` (+ o que a coluna exibir). Meta harmonizada → `{ page, limit, total }`.

## Filtros de lista (`act-list-filters.schema.ts`)
`search?`, `active?`, `order (ASC|DESC)`, `page`, `limit` (mantidos) **+** `hasFinancialTransfer?` (boolean) **+** `occupationArea?` (OccupationArea). Mapeados para a query `active(0|1)`, `hasFinancialTransfer(0|1)`, `occupationArea`.

## Erros (alteração) — `PartnersError` (server domain + cópia client)
Acrescenta (union string; switch exaustivo `never` no `partnersErrorTag`):
```
| 'act-number-duplicate'        // 409 register/edit/act-number-duplicate
| 'invalid-cnpj'                // 422 invalid-cnpj
| 'invalid-act-period'          // 422 period-end-before-start / period-zero-duration
| 'act-payment-target-required' // 422 act-payment-target-required
```

### Mapeamento (core-api-acts `SLUG_TO_ERROR`)
| code | → PartnersError |
|---|---|
| register-act-number-duplicate / edit-act-number-duplicate / act-number-duplicate | act-number-duplicate |
| invalid-cnpj | invalid-cnpj |
| period-end-before-start / period-zero-duration | invalid-act-period |
| act-payment-target-required | act-payment-target-required |
| (act-*-required, occupation-area-*, demais) | validation (fallback existente) |

## i18n (novas strings)
- Labels: `partners.acts.form.actNumber|name|email|cnpj|corporateName|fantasyName|legalRepresentative|startDate|endDate|hasFinancialTransfer|section.payment` (+ reuso de pix/bank do supplier ou tags próprias do act).
- Áreas: `partners.acts.area.{PARC,DDI,DCE,EPV}` (já existem).
- Erros: `partners.error.{act-number-duplicate,invalid-cnpj,invalid-act-period,act-payment-target-required}`.

## Removidos (SC-004)
`cpf`, `role`, `startOfContract`, `employmentRelationship`, `RegistrationStatus`/`registration`, e qualquer label/i18n de "completar cadastro" do recurso ACT.

## Invariantes preservadas
`Result<T,E>` ponta a ponta; sem `any`/`throw` fora da borda; Zod na borda (input + response); i18n; views burras (data-hooks no binding, form no controller); boundaries (consumo via páginas/server-fns); naming por postfix.
