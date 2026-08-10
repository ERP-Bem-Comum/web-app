import type { ReactNode } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { PlusIcon, initialsFrom } from '#shared/ui/index.ts'
import {
  BrandDataTable,
  BrandChip,
  BrandNameCell,
  type BrandColumn,
  type BrandTableState,
} from '#shared/ui/brand/brand-data-table.component.tsx'
import { muted } from '#shared/ui/brand/brand-data-table.css.ts'
import { BrandPaginator } from '#shared/ui/brand/brand-paginator.component.tsx'
import {
  screen,
  header,
  headText,
  headTitle,
  headSubtitle,
  headActions,
  primaryButton,
} from '#shared/ui/brand/brand-page.css.ts'

import { useProgramsListBinding } from '../programs-list.binding.ts'
import { totalPages, type ProgramsListState, type ProgramRow } from '../programs-list.view-model.ts'
import { ProgramsFilters } from '../components/programs-filters.component.tsx'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/programas/')

const GRID_TEMPLATE = 'minmax(220px,1.6fr) .8fr minmax(200px,1.6fr) 1fr'

export function ProgramsListPage(): ReactNode {
  const search = routeApi.useSearch()
  const navigate = useNavigate()
  const { state, logos } = useProgramsListBinding(search)

  const hasFilters = (search.search ?? '') !== ''

  const columns: readonly BrandColumn<ProgramRow>[] = [
    {
      // Avatar = LOGO real do programa (placeholder com iniciais quando não há logo).
      key: 'name',
      header: t('programs.list.columns.name'),
      cell: (r) => (
        <BrandNameCell name={r.name} initials={initialsFrom(r.name)} logoUrl={logos.get(r.id) ?? null} />
      ),
    },
    { key: 'sigla', header: t('programs.list.columns.sigla'), cell: (r) => r.sigla },
    {
      key: 'characteristics',
      header: t('programs.list.columns.characteristics'),
      cell: (r) => (
        <span className={muted}>{r.generalCharacteristics !== '' ? r.generalCharacteristics : '—'}</span>
      ),
    },
    {
      key: 'status',
      header: t('programs.list.columns.status'),
      cell: (r) => (
        <BrandChip
          tone={r.status === 'ATIVO' ? 'ok' : 'danger'}
          label={t(r.status === 'ATIVO' ? 'programs.status.active' : 'programs.status.inactive')}
        />
      ),
    },
  ]

  const pageNum = search.page
  const pages = state.status === 'ready' ? totalPages(state.meta) : 1

  return (
    <div className={screen}>
      <div className={header}>
        <div className={headText}>
          <h1 className={headTitle}>{t('programs.list.title')}</h1>
          <p className={headSubtitle}>{t('programs.list.subtitle')}</p>
        </div>
        <div className={headActions}>
          {/* RBAC `program:write` é cobrado pelo backend no submit (403); o seed ainda não concede. */}
          <button
            type="button"
            className={primaryButton}
            onClick={() => void navigate({ to: '/programas/criar' })}
          >
            <PlusIcon size={16} />
            {t('programs.list.new')}
          </button>
        </div>
      </div>

      <ProgramsFilters
        searchValue={search.search ?? ''}
        searchLabel={t('programs.list.search')}
        onSearch={(value) =>
          void navigate({
            to: '.',
            replace: true,
            search: (p) => ({ ...p, search: value || undefined, page: 1 }),
          })
        }
      />

      <BrandDataTable<ProgramRow>
        columns={columns}
        gridTemplate={GRID_TEMPLATE}
        state={toTableState(state)}
        rowKey={(r) => r.id}
        caption={t('programs.list.title')}
        emptyLabel={hasFilters ? t('programs.list.no-results') : t('programs.list.empty')}
        loadingLabel={t('programs.list.loading')}
        onRowClick={(r) => void navigate({ to: '/programas/$id', params: { id: r.id } })}
      />

      <BrandPaginator
        page={pageNum}
        totalPages={pages}
        perPage={search.limit}
        labels={{
          previous: t('programs.paginator.previous'),
          next: t('programs.paginator.next'),
          page: t('programs.paginator.page'),
          of: t('programs.paginator.of'),
          perPage: t('programs.paginator.perPage'),
        }}
        onPrev={() => void navigate({ to: '.', search: (p) => ({ ...p, page: Math.max(1, pageNum - 1) }) })}
        onNext={() => void navigate({ to: '.', search: (p) => ({ ...p, page: pageNum + 1 }) })}
        onPerPage={(perPage) =>
          void navigate({ to: '.', search: (p) => ({ ...p, limit: perPage, page: 1 }) })
        }
      />
    </div>
  )
}

function toTableState(state: ProgramsListState): BrandTableState<ProgramRow> {
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
