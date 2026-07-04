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
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

import { useUsersListBinding } from '../users-list.binding.ts'
import { totalPages, type UsersListState, type UserRow } from '../users-list.view-model.ts'
import { UsersFilters } from '../components/users-filters.component.tsx'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/usuarios/')

// Avatar de usuário = azul da marca (não há `partnerType` de usuário).
const AVATAR = { bg: brand.color.cadBg, fg: brand.color.cadFg }
const GRID_TEMPLATE = 'minmax(240px,2fr) 1.2fr 1fr'

export function UsersListPage(): ReactNode {
  const search = routeApi.useSearch()
  const navigate = useNavigate()
  const { state } = useUsersListBinding(search)

  const hasFilters = (search.search ?? '') !== '' || search.status !== 'all'

  const columns: readonly BrandColumn<UserRow>[] = [
    {
      key: 'name',
      header: t('users.list.columns.name'),
      cell: (r) => (
        <BrandNameCell name={r.name} initials={initialsFrom(r.name)} bg={AVATAR.bg} fg={AVATAR.fg} />
      ),
    },
    // Perfil (role) NÃO vem na listagem do backend → travessão até o backend expor o perfil na lista.
    { key: 'profile', header: t('users.list.columns.profile'), cell: () => <span className={muted}>—</span> },
    {
      key: 'status',
      header: t('users.list.columns.status'),
      cell: (r) => (
        <BrandChip
          tone={r.activation === 'active' ? 'ok' : 'danger'}
          label={t(`users.status.${r.activation}`)}
        />
      ),
    },
  ]

  const tableState = toTableState(state)
  const pageNum = search.page
  const pages = state.status === 'ready' ? totalPages(state.meta) : 1

  return (
    <div className={screen}>
      <div className={header}>
        <div className={headText}>
          <h1 className={headTitle}>{t('users.list.title')}</h1>
          <p className={headSubtitle}>{t('users.list.subtitle')}</p>
        </div>
        <div className={headActions}>
          {/* RBAC `user:create` é cobrado pelo backend no submit (403); o seed ainda não concede. */}
          <button
            type="button"
            className={primaryButton}
            onClick={() => void navigate({ to: '/usuarios/criar' })}
          >
            <PlusIcon size={16} />
            {t('users.list.new')}
          </button>
        </div>
      </div>

      <UsersFilters
        searchValue={search.search ?? ''}
        status={search.status}
        labels={{
          search: t('users.list.search'),
          all: t('users.filters.all'),
          active: t('users.filters.active'),
          inactive: t('users.filters.inactive'),
        }}
        onSearch={(value) =>
          void navigate({
            to: '.',
            replace: true,
            search: (p) => ({ ...p, search: value || undefined, page: 1 }),
          })
        }
        onStatus={(s) =>
          void navigate({ to: '.', replace: true, search: (p) => ({ ...p, status: s, page: 1 }) })
        }
      />

      <BrandDataTable<UserRow>
        columns={columns}
        gridTemplate={GRID_TEMPLATE}
        state={tableState}
        rowKey={(r) => r.id}
        caption={t('users.list.title')}
        emptyLabel={hasFilters ? t('users.list.no-results') : t('users.list.empty')}
        loadingLabel={t('users.list.loading')}
        onRowClick={(r) => void navigate({ to: '/usuarios/$id', params: { id: r.id } })}
      />

      <BrandPaginator
        page={pageNum}
        totalPages={pages}
        perPage={search.pageSize}
        labels={{
          previous: t('users.paginator.previous'),
          next: t('users.paginator.next'),
          page: t('users.paginator.page'),
          of: t('users.paginator.of'),
          perPage: t('users.paginator.perPage'),
        }}
        onPrev={() => void navigate({ to: '.', search: (p) => ({ ...p, page: Math.max(1, pageNum - 1) }) })}
        onNext={() => void navigate({ to: '.', search: (p) => ({ ...p, page: pageNum + 1 }) })}
        onPerPage={(perPage) =>
          void navigate({ to: '.', search: (p) => ({ ...p, pageSize: perPage, page: 1 }) })
        }
      />
    </div>
  )
}

function toTableState(state: UsersListState): BrandTableState<UserRow> {
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
