import type { ReactNode } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Badge, Button, DataTable, PageHeader, formatMask, type Column, type DataTableState } from '#shared/ui/index.ts'

import { useFinancierListBinding } from '../financier-list.binding.ts'
import { totalPages, type FinancierListState, type FinancierRow } from '../financier-list.view-model.ts'
import { FinancierFilters, type StatusFilter } from '../components/financier-filters.component.tsx'
import { FinancierPaginator } from '../components/financier-paginator.component.tsx'
import { cnpjCell, screen } from './financier-list.css.ts'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/parceiros/financiadores/')

/** CNPJ (14 dígitos) → máscara; entrada inesperada volta crua. */
function formatCnpj(digits: string): string {
  if (digits.length !== 14) return digits
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

function statusFromActive(active: boolean | undefined): StatusFilter {
  if (active === undefined) return 'all'
  return active ? 'active' : 'inactive'
}

export function FinancierListPage(): ReactNode {
  const search = routeApi.useSearch()
  const navigate = useNavigate()
  const { state, canCreate } = useFinancierListBinding(search)

  const hasFilters = (search.search ?? '') !== '' || search.active !== undefined

  const columns: readonly Column<FinancierRow>[] = [
    {
      key: 'corporateName',
      header: t('partners.financiers.columns.corporateName'),
      cell: (r) => r.corporateName,
    },
    {
      key: 'legalRepresentative',
      header: t('partners.financiers.columns.legalRepresentative'),
      cell: (r) => r.legalRepresentative,
    },
    {
      key: 'cnpj',
      header: t('partners.financiers.columns.cnpj'),
      cell: (r) => <span className={cnpjCell}>{formatCnpj(r.cnpj)}</span>,
    },
    { key: 'telephone', header: t('partners.financiers.columns.telephone'), cell: (r) => formatMask('phone', r.telephone) },
    {
      key: 'status',
      header: t('partners.financiers.columns.status'),
      cell: (r) => (
        <Badge variant={r.activation === 'active' ? 'active' : 'outro'}>
          {t(`partners.financiers.status.${r.activation}`)}
        </Badge>
      ),
    },
  ]

  const tableState = toTableState(state)
  const pageNum = search.page
  const pages = state.status === 'ready' ? totalPages(state.meta) : 1

  return (
    <div className={screen}>
      <PageHeader
        title={t('partners.financiers.list.title')}
        subtitle={t('partners.financiers.list.subtitle')}
        actions={
          canCreate ? (
            <Button onClick={() => void navigate({ to: '/parceiros/financiadores/criar' })}>
              {t('partners.financiers.list.new')}
            </Button>
          ) : undefined
        }
      />

      <FinancierFilters
        searchValue={search.search ?? ''}
        status={statusFromActive(search.active)}
        labels={{
          search: t('partners.financiers.list.search'),
          all: t('partners.financiers.filters.all'),
          active: t('partners.financiers.filters.active'),
          inactive: t('partners.financiers.filters.inactive'),
        }}
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
      />

      <DataTable<FinancierRow>
        columns={columns}
        state={tableState}
        rowKey={(r) => r.id}
        emptyLabel={
          hasFilters ? t('partners.financiers.list.no-results') : t('partners.financiers.list.empty')
        }
        loadingLabel={t('partners.financiers.list.loading')}
        caption={t('partners.financiers.list.title')}
        onRowClick={(r) => void navigate({ to: '/parceiros/financiadores/$id', params: { id: r.id } })}
      />

      <FinancierPaginator
        page={pageNum}
        totalPages={pages}
        perPage={search.limit}
        labels={{
          previous: t('partners.financiers.paginator.previous'),
          next: t('partners.financiers.paginator.next'),
          page: t('partners.financiers.paginator.page'),
          perPage: t('partners.financiers.paginator.perPage'),
        }}
        onPrev={() => void navigate({ to: '.', search: (p) => ({ ...p, page: Math.max(1, pageNum - 1) }) })}
        onNext={() => void navigate({ to: '.', search: (p) => ({ ...p, page: pageNum + 1 }) })}
        onPerPage={(perPage) => void navigate({ to: '.', search: (p) => ({ ...p, limit: perPage, page: 1 }) })}
      />
    </div>
  )
}

function toTableState(state: FinancierListState): DataTableState<FinancierRow> {
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
