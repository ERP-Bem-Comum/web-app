import type { ReactNode } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Badge, Button, DataTable, PageHeader, type Column, type DataTableState } from '#shared/ui/index.ts'

import { useUsersListBinding } from '../users-list.binding.ts'
import { totalPages, type UsersListState, type UserRow } from '../users-list.view-model.ts'
import { UsersFilters } from '../components/users-filters.component.tsx'
import { UsersPaginator } from '../components/users-paginator.component.tsx'
import { screen } from './users-list.css.ts'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/usuarios/')

export function UsersListPage(): ReactNode {
  const search = routeApi.useSearch()
  const navigate = useNavigate()
  const { state } = useUsersListBinding(search)

  const hasFilters = (search.search ?? '') !== '' || search.status !== 'all'

  const columns: readonly Column<UserRow>[] = [
    { key: 'name', header: t('users.list.columns.name'), cell: (r) => r.name },
    // Perfil (role) NÃO vem na listagem do backend (só id/name/email/status) → travessão até o backend
    // expor o perfil na lista (ver gap). Ver ticket.
    { key: 'profile', header: t('users.list.columns.profile'), cell: () => '—' },
    {
      key: 'status',
      header: t('users.list.columns.status'),
      cell: (r) => (
        <Badge variant={r.activation === 'active' ? 'active' : 'outro'}>
          {t(`users.status.${r.activation}`)}
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
        title={t('users.list.title')}
        subtitle={t('users.list.subtitle')}
        actions={
          // Botão sempre visível (o RBAC `user:create` é cobrado pelo backend no submit → 403). O seed do
          // admin ainda não concede `user:*`; gatear aqui esconderia a ação. TODO(backend): reintroduzir
          // o gate por `canCreate` quando o seed conceder a permissão.
          <Button onClick={() => void navigate({ to: '/usuarios/criar' })}>
            {t('users.list.new')}
          </Button>
        }
      />

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
          void navigate({ to: '.', replace: true, search: (p) => ({ ...p, search: value || undefined, page: 1 }) })
        }
        onStatus={(s) =>
          void navigate({ to: '.', replace: true, search: (p) => ({ ...p, status: s, page: 1 }) })
        }
      />

      <DataTable<UserRow>
        columns={columns}
        state={tableState}
        rowKey={(r) => r.id}
        emptyLabel={hasFilters ? t('users.list.no-results') : t('users.list.empty')}
        loadingLabel={t('users.list.loading')}
        caption={t('users.list.title')}
        onRowClick={(r) => void navigate({ to: '/usuarios/$id', params: { id: r.id } })}
      />

      <UsersPaginator
        page={pageNum}
        totalPages={pages}
        perPage={search.pageSize}
        labels={{
          previous: t('users.paginator.previous'),
          next: t('users.paginator.next'),
          page: t('users.paginator.page'),
          perPage: t('users.paginator.perPage'),
        }}
        onPrev={() => void navigate({ to: '.', search: (p) => ({ ...p, page: Math.max(1, pageNum - 1) }) })}
        onNext={() => void navigate({ to: '.', search: (p) => ({ ...p, page: pageNum + 1 }) })}
        onPerPage={(perPage) => void navigate({ to: '.', search: (p) => ({ ...p, pageSize: perPage, page: 1 }) })}
      />
    </div>
  )
}

function toTableState(state: UsersListState): DataTableState<UserRow> {
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
