import type { ReactNode } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Badge, Button, DataTable, PageHeader, type Column, type DataTableState } from '#shared/ui/index.ts'

import { useProgramsListBinding } from '../programs-list.binding.ts'
import { totalPages, type ProgramsListState, type ProgramRow } from '../programs-list.view-model.ts'
import { ProgramsFilters } from '../components/programs-filters.component.tsx'
import { ProgramsPaginator } from '../components/programs-paginator.component.tsx'
import { screen, logoCell, logoPlaceholder } from './programs-list.css.ts'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/programas/')

function LogoPlaceholder(): ReactNode {
  return (
    <span className={logoCell}>
      <span className={logoPlaceholder} aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      </span>
    </span>
  )
}

export function ProgramsListPage(): ReactNode {
  const search = routeApi.useSearch()
  const navigate = useNavigate()
  const { state } = useProgramsListBinding(search)

  const hasFilters = (search.search ?? '') !== ''

  const columns: readonly Column<ProgramRow>[] = [
    { key: 'logo', header: t('programs.list.columns.logo'), cell: () => <LogoPlaceholder /> },
    { key: 'name', header: t('programs.list.columns.name'), cell: (r) => r.name },
    {
      key: 'characteristics',
      header: t('programs.list.columns.characteristics'),
      cell: (r) => (r.generalCharacteristics !== '' ? r.generalCharacteristics : '—'),
    },
    {
      key: 'status',
      header: t('programs.list.columns.status'),
      cell: (r) => (
        <Badge variant={r.status === 'ATIVO' ? 'active' : 'terminated'} uppercase size="sm">
          {t(r.status === 'ATIVO' ? 'programs.status.active' : 'programs.status.inactive')}
        </Badge>
      ),
    },
  ]

  const pageNum = search.page
  const pages = state.status === 'ready' ? totalPages(state.meta) : 1

  return (
    <div className={screen}>
      <PageHeader
        title={t('programs.list.title')}
        actions={
          // Botão sempre visível (RBAC `program:write` é cobrado pelo backend no submit → 403). O seed do
          // admin ainda não concede `program:*`; gatear aqui esconderia a ação. TODO(backend): reintroduzir
          // o gate por `canCreate` quando o seed conceder a permissão.
          <Button onClick={() => void navigate({ to: '/programas/criar' })}>{t('programs.list.new')}</Button>
        }
      />

      <ProgramsFilters
        searchValue={search.search ?? ''}
        searchLabel={t('programs.list.search')}
        onSearch={(value) =>
          void navigate({ to: '.', replace: true, search: (p) => ({ ...p, search: value || undefined, page: 1 }) })
        }
      />

      <DataTable<ProgramRow>
        columns={columns}
        state={toTableState(state)}
        rowKey={(r) => r.id}
        emptyLabel={hasFilters ? t('programs.list.no-results') : t('programs.list.empty')}
        loadingLabel={t('programs.list.loading')}
        caption={t('programs.list.title')}
        onRowClick={(r) => void navigate({ to: '/programas/$id', params: { id: r.id } })}
      />

      <ProgramsPaginator
        page={pageNum}
        totalPages={pages}
        perPage={search.limit}
        labels={{
          previous: t('programs.paginator.previous'),
          next: t('programs.paginator.next'),
          page: t('programs.paginator.page'),
          perPage: t('programs.paginator.perPage'),
        }}
        onPrev={() => void navigate({ to: '.', search: (p) => ({ ...p, page: Math.max(1, pageNum - 1) }) })}
        onNext={() => void navigate({ to: '.', search: (p) => ({ ...p, page: pageNum + 1 }) })}
        onPerPage={(perPage) => void navigate({ to: '.', search: (p) => ({ ...p, limit: perPage, page: 1 }) })}
      />
    </div>
  )
}

function toTableState(state: ProgramsListState): DataTableState<ProgramRow> {
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
