import type { ReactNode } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Badge, DataTable, PageHeader, type Column, type DataTableState } from '#shared/ui/index.ts'

import { useCollaboratorListBinding } from '../collaborator-list.binding.ts'
import {
  OCCUPATION_AREAS,
  totalPages,
  type CollaboratorListState,
  type CollaboratorRow,
  type OccupationArea,
} from '../collaborator-list.view-model.ts'
import { CollaboratorFilters, type StatusFilter } from '../components/collaborator-filters.component.tsx'
import { CollaboratorPaginator } from '../components/collaborator-paginator.component.tsx'
import { screen } from './collaborator-list.css.ts'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/parceiros/colaboradores/')

const isOccupationArea = (v: string): v is OccupationArea =>
  (OCCUPATION_AREAS as readonly string[]).includes(v)

/** Área → label i18n quando casa o enum; senão exibe o valor cru (tolerância a legado). */
function areaLabel(area: string): string {
  return isOccupationArea(area) ? t(`partners.collaborators.area.${area}`) : area
}

function statusFromActive(active: boolean | undefined): StatusFilter {
  if (active === undefined) return 'all'
  return active ? 'active' : 'inactive'
}

export function CollaboratorListPage(): ReactNode {
  const search = routeApi.useSearch()
  const navigate = useNavigate()
  const { state } = useCollaboratorListBinding(search)

  const hasFilters = (search.search ?? '') !== '' || search.active !== undefined

  const columns: readonly Column<CollaboratorRow>[] = [
    { key: 'name', header: t('partners.collaborators.columns.name'), cell: (r) => r.name },
    { key: 'email', header: t('partners.collaborators.columns.email'), cell: (r) => r.email },
    {
      key: 'area',
      header: t('partners.collaborators.columns.occupationArea'),
      cell: (r) => areaLabel(r.occupationArea),
    },
    { key: 'role', header: t('partners.collaborators.columns.role'), cell: (r) => r.role },
    {
      key: 'registration',
      header: t('partners.collaborators.columns.registration'),
      align: 'center',
      cell: (r) => (
        <Badge variant={r.registration === 'complete' ? 'active' : 'outro'}>
          {t(`partners.collaborators.registration.${r.registration}`)}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: t('partners.collaborators.columns.status'),
      align: 'center',
      cell: (r) => (
        <Badge variant={r.activation === 'active' ? 'active' : 'outro'}>
          {t(`partners.collaborators.status.${r.activation}`)}
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
        title={t('partners.collaborators.list.title')}
        subtitle={t('partners.collaborators.list.subtitle')}
      />

      <CollaboratorFilters
        searchValue={search.search ?? ''}
        status={statusFromActive(search.active)}
        labels={{
          search: t('partners.collaborators.list.search'),
          all: t('partners.collaborators.filters.all'),
          active: t('partners.collaborators.filters.active'),
          inactive: t('partners.collaborators.filters.inactive'),
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

      <DataTable<CollaboratorRow>
        columns={columns}
        state={tableState}
        rowKey={(r) => r.id}
        emptyLabel={
          hasFilters ? t('partners.collaborators.list.no-results') : t('partners.collaborators.list.empty')
        }
        loadingLabel={t('partners.collaborators.list.loading')}
        caption={t('partners.collaborators.list.title')}
      />

      <CollaboratorPaginator
        page={pageNum}
        totalPages={pages}
        labels={{
          previous: t('partners.collaborators.paginator.previous'),
          next: t('partners.collaborators.paginator.next'),
          page: t('partners.collaborators.paginator.page'),
        }}
        onPrev={() => void navigate({ to: '.', search: (p) => ({ ...p, page: Math.max(1, pageNum - 1) }) })}
        onNext={() => void navigate({ to: '.', search: (p) => ({ ...p, page: pageNum + 1 }) })}
      />
    </div>
  )
}

function toTableState(state: CollaboratorListState): DataTableState<CollaboratorRow> {
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
