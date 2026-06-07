# Data Model: Telas de Financiadores

> A feature **não cria** entidades de domínio (o agregado Financier já existe server-side). Este
> documento descreve os tipos que o `client/` vai espelhar a partir do contrato `financier.io.ts`,
> para ancorar tasks e testes.

## Entidades (do contrato server, consumidas pelo client)

### FinancierListItem (linha da tabela)

| Campo | Tipo | Observação |
|---|---|---|
| `id` | `string` | identidade |
| `name` | `string` | nome fantasia |
| `corporateName` | `string` | razão social |
| `cnpj` | `string` | exibido com máscara |
| `telephone` | `string` | |
| `activation` | `'active' \| 'inactive'` | status |

> Diferente do supplier: **sem** coluna `email`.

### FinancierDetail (tela de detalhe)

`FinancierListItem` **+**:

| Campo | Tipo |
|---|---|
| `legalRepresentative` | `string` |
| `address` | `string` |

### Entrada de escrita (create/update) — 6 campos obrigatórios

| Campo | Regra (do contrato) |
|---|---|
| `name` | 1..200 |
| `corporateName` | 1..200 |
| `legalRepresentative` | 1..200 |
| `cnpj` | 14..18 (aceita máscara; client normaliza p/ 14 dígitos) |
| `telephone` | 1..20 |
| `address` | 1..300 |

- **Create**: os 6 campos. **Update**: os 6 campos **+ `id`** (PUT total — substituição).

### Filtros de listagem (search params)

| Campo | Tipo | Default |
|---|---|---|
| `search` | `string?` (≤120) | — |
| `active` | `boolean?` | — (todos) |
| `order` | `'ASC' \| 'DESC'` | `ASC` |
| `page` | `int ≥1` | `1` |
| `limit` | `int 1..100` | `5` |

### Resposta de listagem

`{ items: FinancierListItem[], meta: { page, limit, total } }`

## Tipos do client a definir (espelho do supplier)

- `client/data/model/financier.model.ts`: `FinancierListInput`, `FinancierListResponse`,
  `FinancierDetail`, `FinancierWriteInput` (tipos **locais** — boundary §I, não importa server/domain).
- `client/domain/financier.types.ts`: tipos de UI reexpostos para as views.
- `client/domain/financier.schemas.ts`: `FinancierListFiltersSchema` (search params) + schema do form.

## Transições de estado

- **Status do financiador**: `active ⇄ inactive` via desativar/reativar (ações de escrita,
  gated por `financier:write`). Sem outras transições.
- **UI-state** (form/filtros): controllers locais (`useReducer`/controller), separados do server-state
  (TanStack Query) — §XI.

## Erros (cadeia §V)

`PartnersError` (string union local, espelha o server): `not-found | validation | unauthorized |
forbidden | conflict | …` → `partners-error-tag` → tag i18n → texto na UI. A UI nunca olha status HTTP.
