# Quickstart — Consumindo os Organismos

Como uma feature (ex.: telas de parceiros) compõe o esqueleto de uma listagem usando **apenas** os organismos do design system + a ViewModel. As strings vêm do i18n **da feature**.

## Esqueleto de uma tela de listagem

```tsx
import { DataTable, PageHeader, Button, Badge, type Column, type DataTableState } from '#shared/ui'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

// Tipo de domínio vindo da ViewModel (ex.: fornecedor)
type SupplierRow = Readonly<{ id: string; name: string; document: string; active: boolean }>

const t = createTranslator(ptBR)

const columns: readonly Column<SupplierRow>[] = [
  { key: 'name', header: t('partners.suppliers.columns.name'), cell: (r) => r.name },
  { key: 'document', header: t('partners.suppliers.columns.document'), cell: (r) => r.document, width: 'narrow' },
  {
    key: 'status',
    header: t('partners.suppliers.columns.status'),
    align: 'center',
    cell: (r) => <Badge variant={r.active ? 'active' : 'inactive'}>{/* label */}</Badge>,
  },
]

// View burra: recebe tudo da ViewModel por props
export function SuppliersListPage(props: Readonly<{
  state: DataTableState<SupplierRow>
  onCreate: () => void
}>) {
  return (
    <>
      <PageHeader
        title={t('partners.suppliers.title')}
        subtitle={t('partners.suppliers.subtitle')}
        actions={<Button onClick={props.onCreate}>{t('partners.suppliers.create')}</Button>}
      />
      <DataTable
        columns={columns}
        state={props.state}
        rowKey={(r) => r.id}
        emptyLabel={t('partners.suppliers.empty')}
        loadingLabel={t('common.loading')}
        caption={t('partners.suppliers.title')}
      />
    </>
  )
}
```

## Pontos-chave

- **Agnóstico**: `DataTable`/`PageHeader` não sabem o que é "fornecedor". Recebem colunas, estado e textos.
- **Estados**: a ViewModel monta `state` como `{ status: 'loading' }`, `{ status: 'error', message }` ou `{ status: 'ready', rows }`. A tabela trata vazio quando `rows` é `[]`.
- **i18n**: tags resolvidas na feature; o organismo só recebe `string`.
- **Composição**: ações (`<Button>`) e células ricas (`<Badge>`) entram por slot/render-prop.

## Checklist de conformidade ao criar/alterar um organismo

- [ ] Pasta em `src/shared/ui/organisms/<nome>/` com `component` + `css` + `index` (+ `types` se preciso).
- [ ] Props `Readonly<>`, sem `any`, sem `class`/`this`/`throw`.
- [ ] `.css.ts` só com `vars.*` (sem hex/rgb/hsl/px crus).
- [ ] Sem import de `modules/`/`data/`/`server/`/catálogo i18n.
- [ ] Re-exportado no barrel (`organisms/index.ts` → `shared/ui/index.ts`).
- [ ] Teste de DOM (`*.spec.tsx`) cobrindo os critérios de aceite.
- [ ] Baseline visual (`e2e/visual/organisms.visual.e2e.ts`) dos estados principais.
- [ ] `pnpm verify` (typecheck + lint + test) verde; `pnpm test:visual` verde.
```
