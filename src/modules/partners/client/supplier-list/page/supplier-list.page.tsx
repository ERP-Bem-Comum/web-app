import { useEffect, useState, type ReactNode } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Badge, Button, DataTable, PageHeader, type Column, type DataTableState } from '#shared/ui/index.ts'

import { useSupplierListBinding } from '../supplier-list.binding.ts'
import { totalPages, type SupplierListState, type SupplierRow } from '../supplier-list.view-model.ts'
import { SupplierFilters, type StatusFilter } from '../components/supplier-filters.component.tsx'
import { SupplierPaginator } from '../components/supplier-paginator.component.tsx'
import { PartnersExportDropdown } from '#modules/partners/client/shared/partners-export-dropdown.component.tsx'
import { PartnersPrintable } from '#modules/partners/client/shared/partners-printable.component.tsx'
import { contentWrap, contentWrapPrintHidden } from '#modules/partners/client/shared/export-print.css.ts'
import { cnpjCell, screen } from './supplier-list.css.ts'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/parceiros/fornecedores/')

/** CNPJ (14 dígitos) → máscara; entrada inesperada volta crua. */
function formatCnpj(digits: string): string {
  if (digits.length !== 14) return digits
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

function statusFromActive(active: boolean | undefined): StatusFilter {
  if (active === undefined) return 'all'
  return active ? 'active' : 'inactive'
}

export function SupplierListPage(): ReactNode {
  const search = routeApi.useSearch()
  const navigate = useNavigate()
  const { state, canCreate, categories } = useSupplierListBinding(search)
  const [printing, setPrinting] = useState(false)

  // PDF = window.print (mesmo mecanismo dos Contratos): liga o printable, imprime e desliga.
  useEffect(() => {
    if (!printing) return
    const id = setTimeout(() => { window.print(); setPrinting(false) }, 0)
    return () => { clearTimeout(id) }
  }, [printing])

  const hasFilters =
    (search.search ?? '') !== '' ||
    search.active !== undefined ||
    (search.categories?.length ?? 0) > 0

  const columns: readonly Column<SupplierRow>[] = [
    { key: 'name', header: t('partners.suppliers.columns.name'), cell: (r) => r.name },
    { key: 'email', header: t('partners.suppliers.columns.email'), cell: (r) => r.email },
    {
      key: 'cnpj',
      header: t('partners.suppliers.columns.cnpj'),
      cell: (r) => <span className={cnpjCell}>{formatCnpj(r.cnpj)}</span>,
    },
    {
      key: 'contracts',
      header: t('partners.suppliers.columns.contracts'),
      cell: () => '—',
    },
    {
      key: 'status',
      header: t('partners.suppliers.columns.status'),
      cell: (r) => (
        <Badge variant={r.activation === 'active' ? 'active' : 'outro'}>
          {t(`partners.suppliers.status.${r.activation}`)}
        </Badge>
      ),
    },
  ]

  const tableState = toTableState(state)
  const pageNum = search.page
  const pages = state.status === 'ready' ? totalPages(state.meta) : 1
  const rows = state.status === 'ready' ? state.rows : []

  const exportColumns: readonly string[] = [
    t('partners.suppliers.columns.name'),
    t('partners.suppliers.columns.email'),
    t('partners.suppliers.columns.cnpj'),
    t('partners.suppliers.columns.status'),
  ]
  const exportRows: readonly (readonly string[])[] = rows.map((r) => [
    r.name,
    r.email,
    formatCnpj(r.cnpj),
    t(`partners.suppliers.status.${r.activation}`),
  ])

  return (
    <div className={screen}>
      <div className={printing ? contentWrapPrintHidden : contentWrap}>
        <PageHeader
          title={t('partners.suppliers.list.title')}
          subtitle={t('partners.suppliers.list.subtitle')}
          actions={
            canCreate ? (
              <Button onClick={() => void navigate({ to: '/parceiros/fornecedores/criar' })}>
                {t('partners.suppliers.list.new')}
              </Button>
            ) : undefined
          }
        />

        <SupplierFilters
          searchValue={search.search ?? ''}
          status={statusFromActive(search.active)}
          category={search.categories?.[0] ?? ''}
          categories={categories}
          labels={{
            search: t('partners.suppliers.list.search'),
            all: t('partners.suppliers.filters.all'),
            active: t('partners.suppliers.filters.active'),
            inactive: t('partners.suppliers.filters.inactive'),
            toggle: t('partners.suppliers.filters.toggle'),
            category: t('partners.suppliers.filters.category'),
            contractStatus: t('partners.suppliers.filters.contractStatus'),
            allOption: t('partners.suppliers.filters.allOption'),
            gatedHint: t('partners.suppliers.filters.gatedHint'),
            apply: t('partners.suppliers.filters.apply'),
          }}
          exportSlot={
            <PartnersExportDropdown
              exportLabel={t('partners.suppliers.filters.export')}
              filenameBase="fornecedores"
              headers={exportColumns}
              rows={exportRows}
              onPrint={() => { setPrinting(true) }}
            />
          }
          onSearch={(value) =>
            void navigate({ to: '.', replace: true, search: (p) => ({ ...p, search: value || undefined, page: 1 }) })
          }
          onStatus={(s) =>
            void navigate({
              to: '.',
              replace: true,
              search: (p) => ({ ...p, active: s === 'all' ? undefined : s === 'active', page: 1 }),
            })
          }
          onCategory={(c) =>
            void navigate({
              to: '.',
              replace: true,
              search: (p) => ({ ...p, categories: c ? [c] : undefined, page: 1 }),
            })
          }
        />

        <DataTable<SupplierRow>
          columns={columns}
          state={tableState}
          rowKey={(r) => r.id}
          emptyLabel={hasFilters ? t('partners.suppliers.list.no-results') : t('partners.suppliers.list.empty')}
          loadingLabel={t('partners.suppliers.list.loading')}
          caption={t('partners.suppliers.list.title')}
          onRowClick={(r) => void navigate({ to: '/parceiros/fornecedores/$id', params: { id: r.id } })}
        />

        <SupplierPaginator
          page={pageNum}
          totalPages={pages}
          perPage={search.limit}
          labels={{
            previous: t('partners.suppliers.paginator.previous'),
            next: t('partners.suppliers.paginator.next'),
            page: t('partners.suppliers.paginator.page'),
            perPage: t('partners.suppliers.paginator.perPage'),
          }}
          onPrev={() => void navigate({ to: '.', search: (p) => ({ ...p, page: Math.max(1, pageNum - 1) }) })}
          onNext={() => void navigate({ to: '.', search: (p) => ({ ...p, page: pageNum + 1 }) })}
          onPerPage={(perPage) => void navigate({ to: '.', search: (p) => ({ ...p, limit: perPage, page: 1 }) })}
        />
      </div>

      <PartnersPrintable
        title={t('partners.suppliers.list.title')}
        emittedLabel={t('partners.export.count').replace('{n}', String(rows.length))}
        columns={exportColumns}
        rows={exportRows}
        emptyLabel={t('partners.suppliers.list.empty')}
      />
    </div>
  )
}

function toTableState(state: SupplierListState): DataTableState<SupplierRow> {
  switch (state.status) {
    case 'loading':
      return { status: 'loading' }
    case 'error':
      return { status: 'error', message: t(state.errorTag) }
    case 'ready':
      return { status: 'ready', rows: state.rows }
    default: {
      const _exhaustive: never = state
      return _exhaustive
    }
  }
}
