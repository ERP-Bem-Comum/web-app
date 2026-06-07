# Contrato de Tela — Listagem de Fornecedores (US1)

**Rota**: `/_authenticated/parceiros/fornecedores/` (`index.tsx`) · `validateSearch` = `SupplierListFiltersSchema`.

**Composição (view burra)**: `PageHeader` (título + ação "Novo fornecedor", gated por `supplier:write`) → barra de filtros (local: busca, status, categorias, ordenação) → `DataTable<SupplierRow>` → paginador (local).

## Entradas (props da ViewModel/binding)
- `state: DataTableState<SupplierRow>` (loading | error | ready) derivado do `useQuery`.
- `filters: SupplierListFilters` (dos search params).
- callbacks: `onSearch`, `onToggleStatus`, `onToggleCategory`, `onChangeOrder`, `onChangePage`, `onCreate`, `onView(id)`.
- `canCreate: boolean` (= `can(granted, 'supplier:write')`).

## Comportamento
| Estado | Render |
|---|---|
| loading | `DataTable` em loading |
| ready + itens | linhas com nome, CNPJ, e-mail, categoria, status (`Badge`), ações (ver) |
| ready + vazio (sem filtro) | estado vazio "nenhum fornecedor" |
| ready + sem-resultado (com filtro) | `emptyLabel` "nenhum resultado" |
| error | mensagem i18n (via `supplier-error-tag`) |

- Mudar qualquer filtro reseta `page` para 1 (R5). Filtros/paginação na URL.
- Categorias do filtro vêm de `listServiceCategoriesFn` (R6).

## Critérios de aceite (US1): cenários 1–7 da spec.

## Testes
- `supplier-list.view-model.test.ts` (node:test): map model→row; derivação de `DataTableState`; reset de página.
- (visual opcional em polish.)
