import type { ReactNode } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Badge, Button, DataTable, PageHeader, type Column, type DataTableState } from '#shared/ui/index.ts'

import { useActListBinding } from '../act-list.binding.ts'
import {
  OCCUPATION_AREAS,
  totalPages,
  type ActListState,
  type ActRow,
} from '../act-list.view-model.ts'
import { ActFilters, type StatusFilter } from '../components/act-filters.component.tsx'
import { ActPaginator } from '../components/act-paginator.component.tsx'
import { screen } from './act-list.css.ts'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/parceiros/atos/')

function statusFromActive(active: boolean | undefined): StatusFilter {
  if (active === undefined) return 'all'
  return active ? 'active' : 'inactive'
}

export function ActListPage(): ReactNode {
  const search = routeApi.useSearch()
  const navigate = useNavigate()
  const { state, canCreate } = useActListBinding(search)

  const hasFilters = (search.search ?? '') !== '' || search.active !== undefined

  const columns: readonly Column<ActRow>[] = [
    // Nº do Instrumento e Parceiro Principal (Razão Social): campos do "Acordo" ainda sem suporte no
    // backend do ACT (hoje pessoa-física) → travessão até a reformulação. Ver ticket.
    { key: 'number', header: t('partners.acts.columns.actNumber'), cell: () => '—' },
    { key: 'partner', header: t('partners.acts.columns.partner'), cell: () => '—' },
    { key: 'title', header: t('partners.acts.columns.objectTitle'), cell: (r) => r.name },
    {
      key: 'status',
      header: t('partners.acts.columns.status'),
      cell: (r) => (
        <Badge variant={r.activation === 'active' ? 'active' : 'outro'}>
          {t(`partners.acts.status.${r.activation}`)}
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
        title={t('partners.acts.list.title')}
        subtitle={t('partners.acts.list.subtitle')}
        actions={
          canCreate ? (
            <Button onClick={() => void navigate({ to: '/parceiros/atos/criar' })}>
              {t('partners.acts.list.new')}
            </Button>
          ) : undefined
        }
      />

      <ActFilters
        searchValue={search.search ?? ''}
        status={statusFromActive(search.active)}
        areaOptions={OCCUPATION_AREAS.map((a) => ({ value: a, label: t(`partners.acts.area.${a}`) }))}
        labels={{
          search: t('partners.acts.list.search'),
          all: t('partners.acts.filters.all'),
          active: t('partners.acts.filters.active'),
          inactive: t('partners.acts.filters.inactive'),
          toggle: t('partners.acts.filters.toggle'),
          tipo: t('partners.acts.filters.tipo'),
          comRepasse: t('partners.acts.filters.comRepasse'),
          semRepasse: t('partners.acts.filters.semRepasse'),
          area: t('partners.acts.filters.area'),
          allOption: t('partners.acts.filters.allOption'),
          gatedHint: t('partners.acts.filters.gatedHint'),
          apply: t('partners.acts.filters.apply'),
          export: t('partners.acts.filters.export'),
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
        onExport={() => { /* TODO: export CSV de ACTs (follow-up; ver gaps) */ }}
      />

      <DataTable<ActRow>
        columns={columns}
        state={tableState}
        rowKey={(r) => r.id}
        emptyLabel={hasFilters ? t('partners.acts.list.no-results') : t('partners.acts.list.empty')}
        loadingLabel={t('partners.acts.list.loading')}
        caption={t('partners.acts.list.title')}
        onRowClick={(r) => void navigate({ to: '/parceiros/atos/$id', params: { id: r.id } })}
      />

      <ActPaginator
        page={pageNum}
        totalPages={pages}
        perPage={search.limit}
        labels={{
          previous: t('partners.acts.paginator.previous'),
          next: t('partners.acts.paginator.next'),
          page: t('partners.acts.paginator.page'),
          perPage: t('partners.acts.paginator.perPage'),
        }}
        onPrev={() => void navigate({ to: '.', search: (p) => ({ ...p, page: Math.max(1, pageNum - 1) }) })}
        onNext={() => void navigate({ to: '.', search: (p) => ({ ...p, page: pageNum + 1 }) })}
        onPerPage={(perPage) => void navigate({ to: '.', search: (p) => ({ ...p, limit: perPage, page: 1 }) })}
      />
    </div>
  )
}

function toTableState(state: ActListState): DataTableState<ActRow> {
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
