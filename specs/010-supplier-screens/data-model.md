# Data Model — Telas de Fornecedores (Phase 1)

> Tipos do **client**. Os modelos de resposta vêm do `public-api` (`SupplierListItem`, `SupplierDetail`,
> `SupplierListResponse`); aqui definimos os **inputs do usuário** (filtros + form) e os **derivados de UI**
> (row, estado). TS strict, `Readonly`, sem `any`/`enum`. Zod no client valida a borda (search + form).

## Vindos do `#modules/partners/public-api` (não redefinir)

```ts
type ActivationStatus = 'active' | 'inactive'
type SupplierListItem = Readonly<{ id; name; email; cnpj; corporateName; fantasyName; serviceCategory; activation }>
type SupplierDetail   = SupplierListItem & Readonly<{ bankAccount: BankAccount | null; pixKey: SupplierPixKey | null }>
type SupplierListResponse = Readonly<{ items: readonly SupplierListItem[]; meta: { page; limit; total } }>
type BankAccount   = Readonly<{ bank; agency; accountNumber; checkDigit }>
type SupplierPixKey = Readonly<{ keyType: 'cpf'|'cnpj'|'email'|'phone'|'random-key'; key }>
```

## Filtros da listagem (search params da rota)

`domain/supplier.schemas.ts` → `SupplierListFiltersSchema` (Zod, usado em `validateSearch`):

| Campo | Tipo | Default | Notas |
|---|---|---|---|
| `search` | `string?` | — | trim, max 120 |
| `active` | `boolean?` | — | filtro de status (omitido = todos) |
| `categories` | `readonly string[]?` | — | cada max 80 |
| `order` | `'ASC' \| 'DESC'` | `'ASC'` | ordenação |
| `page` | `int ≥ 1` | `1` | reset p/ 1 ao mudar filtro |
| `limit` | `int [1,100]` | `5` | tamanho da página |

```ts
export type SupplierListFilters = z.infer<typeof SupplierListFiltersSchema>
```

## Valores do formulário (create/edit)

`domain/supplier.schemas.ts` → `SupplierFormSchema` (Zod, usado no controller):

| Campo | Tipo | Obrigatório | Regra |
|---|---|---|---|
| `name` | string | sim | 1–200 |
| `corporateName` | string | sim | 1–200 |
| `fantasyName` | string | sim | 1–200 |
| `email` | string (email) | sim | formato e-mail |
| `cnpj` | string | sim | aceita máscara; normaliza p/ 14 dígitos válidos |
| `serviceCategory` | string | sim | 1–80; valor da lista do backend |
| `bankAccount` | grupo \| null | não | **"tudo ou nada"**: se presente → bank/agency/accountNumber obrigatórios (1–20/1–20/1–30), checkDigit ≤5 |
| `pixKey` | grupo \| null | não | se presente → keyType ∈ união + key 1–140 |

```ts
export type SupplierFormValues = z.infer<typeof SupplierFormSchema>
// edit acrescenta o id ao enviar (UpdateSupplierInput flui da server fn)
```

**Invariantes:** grupos sensíveis (`bankAccount`/`pixKey`) editáveis só com `supplier:edit-sensitive`; campos obrigatórios bloqueiam submit (controller, antes da server fn).

## Derivados de UI

```ts
// Linha da tabela (DataTable<SupplierRow>) — derivada de SupplierListItem por mapper puro
export type SupplierRow = Readonly<{
  id: string; name: string; cnpj: string; email: string
  serviceCategory: string; activation: ActivationStatus
}>

// Estado da tela de detalhe / ação de status (união discriminada)
export type StatusAction = 'deactivate' | 'reactivate'
```

O estado de carregamento das listas/detalhe é o `DataTableState<SupplierRow>` / `Result` derivado no binding a partir do `useQuery` (server-state ≠ UI-state).

## Repository (porta → server fns)

`data/repository/supplier.repository.ts` (interface; devolve `Result`):

```ts
export type SupplierRepository = Readonly<{
  list:        (input: SupplierListFilters) => Promise<Result<SupplierListResponse, AppError>>
  getById:     (id: string)                 => Promise<Result<SupplierDetail, AppError>>
  create:      (input: SupplierFormValues)  => Promise<Result<SupplierDetail, AppError>>
  update:      (input: SupplierFormValues & { id: string }) => Promise<Result<SupplierDetail, AppError>>
  deactivate:  (id: string)                 => Promise<Result<SupplierDetail, AppError>>
  reactivate:  (id: string)                 => Promise<Result<SupplierDetail, AppError>>
  categories:  ()                           => Promise<Result<readonly string[], AppError>>
}>
```

`supplier.repository.instance.ts` faz o wire das 7 server fns reais (`listSuppliersFn` … `listServiceCategoriesFn`), convertendo a resposta em `Result` (espelha `contracts.repository.instance`).
