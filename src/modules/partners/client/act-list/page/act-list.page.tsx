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
  type OccupationArea,
} from '../act-list.view-model.ts'
import { ActFilters, type StatusFilter } from '../components/act-filters.component.tsx'
import { ActPaginator } from '../components/act-paginator.component.tsx'
import { screen } from './act-list.css.ts'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/parceiros/atos/')

const isOccupationArea = (v: string): v is OccupationArea =>
  (OCCUPATION_AREAS as readonly string[]).includes(v)

/** Área de atuação → label i18n quando casa o enum; senão exibe o valor cru (tolerância a legado). */
function areaLabel(area: string): string {
  return isOccupationArea(area) ? t(`partners.acts.area.${area}`) : area
}

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
    { key: 'name', header: t('partners.acts.columns.name'), cell: (r) => r.name },
    { key: 'email', header: t('partners.acts.columns.email'), cell: (r) => r.email },
    { key: 'area', header: t('partners.acts.columns.occupationArea'), cell: (r) => areaLabel(r.occupationArea) },
    { key: 'role', header: t('partners.acts.columns.role'), cell: (r) => r.role },
    {
      key: 'registration',
      header: t('partners.acts.columns.registration'),
      align: 'center',
      cell: (r) => (
        <Badge variant={r.registration === 'complete' ? 'active' : 'outro'}>
          {t(`partners.acts.registration.${r.registration}`)}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: t('partners.acts.columns.status'),
      align: 'center',
      cell: (r) => (
        <Badge variant={r.activation === 'active' ? 'active' : 'outro'}>
          {t(`partners.acts.status.${r.activation}`)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: t('partners.acts.columns.actions'),
      align: 'end',
      cell: (r) => (
        <Button onClick={() => void navigate({ to: '/parceiros/atos/$id', params: { id: r.id } })}>
          {t('partners.acts.actions.view')}
        </Button>
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
        labels={{
          search: t('partners.acts.list.search'),
          all: t('partners.acts.filters.all'),
          active: t('partners.acts.filters.active'),
          inactive: t('partners.acts.filters.inactive'),
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

      <DataTable<ActRow>
        columns={columns}
        state={tableState}
        rowKey={(r) => r.id}
        emptyLabel={hasFilters ? t('partners.acts.list.no-results') : t('partners.acts.list.empty')}
        loadingLabel={t('partners.acts.list.loading')}
        caption={t('partners.acts.list.title')}
      />

      <ActPaginator
        page={pageNum}
        totalPages={pages}
        labels={{
          previous: t('partners.acts.paginator.previous'),
          next: t('partners.acts.paginator.next'),
          page: t('partners.acts.paginator.page'),
        }}
        onPrev={() => void navigate({ to: '.', search: (p) => ({ ...p, page: Math.max(1, pageNum - 1) }) })}
        onNext={() => void navigate({ to: '.', search: (p) => ({ ...p, page: pageNum + 1 }) })}
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
