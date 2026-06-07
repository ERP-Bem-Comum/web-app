# Quickstart — Telas de Fornecedores

Como o vertical de Fornecedores se liga, espelhando `contracts/client`.

## Fluxo de uma tela (listagem)

```
rota (index.tsx, validateSearch=SupplierListFiltersSchema)
  → supplier-list.binding.ts  (useQuery sobre supplier-list.query.ts → repository.list)
      → supplier-list.view-model.ts  (puro: map model→SupplierRow, deriva DataTableState)
      → supplier-list.page.tsx  (BURRA: PageHeader + filtros + DataTable<SupplierRow> + paginador)
```

- **Dados**: `supplier.repository.instance` faz `listSuppliersFn({ data: filters })` → `Result`.
- **Organismos**: `import { DataTable, PageHeader, Badge, type Column } from '#shared/ui/index.ts'`.
- **i18n**: `partners.suppliers.*` resolvido na page/binding; o `DataTable` recebe textos por props.
- **RBAC**: `can(granted, 'supplier:write')` habilita "Novo fornecedor".

## Camadas (sufixo = camada, §XI)

| Arquivo | Papel | Pode React? |
|---|---|---|
| `*.query.ts` / `*.mutation.ts` | queryKey/queryOptions / mutationOptions (puro) | ❌ |
| `*.view-model.ts` | derivação pura (model→row, estado, gates) | ❌ |
| `*.binding.ts` | adapter: `useQuery`/`useMutation` → estado/Command | ✅ |
| `*.page.tsx` / `*.component.tsx` | view burra (props → JSX) | ✅ (sem data-hooks) |
| `*.controller.ts` | estado de form (Zod na borda) | ✅ |
| `data/repository/*` | porta → server fn (Result) | ❌ |

## Checklist de conformidade (por tela)
- [ ] View burra (sem `useQuery`/`useMutation`/`useReducer`; sem import de `server/`/`data` direto).
- [ ] view-model/repository sem `react`/`@tanstack/react-*`.
- [ ] Erros → `supplier-error-tag` (switch exaustivo) → tag i18n; UI nunca olha status.
- [ ] Strings via `partners.suppliers.*`; CSS local só-tokens.
- [ ] RBAC via `can()`; bancário/PIX sob `supplier:edit-sensitive`.
- [ ] Listagem usa `DataTable` + `PageHeader` (sem tabela/cabeçalho local).
- [ ] `pnpm verify` + `pnpm test:dom` verdes.
```
