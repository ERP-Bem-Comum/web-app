import type { ReactNode } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Badge, Button, DataTable, PageHeader, type Column, type DataTableState } from '#shared/ui/index.ts'

import { useCollaboratorListBinding } from '../collaborator-list.binding.ts'
import {
  OCCUPATION_AREAS,
  EMPLOYMENT_RELATIONSHIPS,
  totalPages,
  type CollaboratorListState,
  type CollaboratorRow,
  type OccupationArea,
} from '../collaborator-list.view-model.ts'
import { CollaboratorFilters, type StatusFilter } from '../components/collaborator-filters.component.tsx'
import { CollaboratorPaginator } from '../components/collaborator-paginator.component.tsx'
import { screen, statusCell, registrationText, toolbarActions, importButton } from './collaborator-list.css.ts'

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
  const { state, canCreate } = useCollaboratorListBinding(search)

  const hasFilters =
    (search.search ?? '') !== '' ||
    search.active !== undefined ||
    search.status !== undefined ||
    search.area !== undefined ||
    search.employment !== undefined ||
    (search.role ?? '') !== '' ||
    search.year !== undefined

  const columns: readonly Column<CollaboratorRow>[] = [
    { key: 'name', header: t('partners.collaborators.columns.legalRepresentative'), cell: (r) => r.name },
    { key: 'email', header: t('partners.collaborators.columns.email'), cell: (r) => r.email },
    {
      key: 'area',
      header: t('partners.collaborators.columns.occupationArea'),
      cell: (r) => areaLabel(r.occupationArea),
    },
    {
      // Contratos/Aditivos: coluna do legado; o item da lista do backend ainda não traz a contagem.
      key: 'contracts',
      header: t('partners.collaborators.columns.contracts'),
      cell: () => '—',
    },
    { key: 'role', header: t('partners.collaborators.columns.role'), cell: (r) => r.role },
    {
      // Status duplo (legado): badge de ativação + situação cadastral abaixo.
      key: 'status',
      header: t('partners.collaborators.columns.status'),
      cell: (r) => (
        <div className={statusCell}>
          <Badge variant={r.activation === 'active' ? 'active' : 'outro'}>
            {t(`partners.collaborators.status.${r.activation}`)}
          </Badge>
          <span className={registrationText}>
            {t(`partners.collaborators.registration.${r.registration}`)}
          </span>
        </div>
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
        actions={
          canCreate ? (
            <div className={toolbarActions}>
              {/* Importar CSV/Excel — botão do legado. Wiring da importação (file → importCsv) é follow-up
                  (backend `import-collaborators` já existe); ver gaps documentados. */}
              <button
                type="button"
                className={importButton}
                title={t('partners.collaborators.list.import')}
                onClick={() => { /* TODO: abrir fluxo de importação CSV/Excel (import-collaborators) */ }}
              >
                {t('partners.collaborators.list.import')}
              </button>
              <Button onClick={() => void navigate({ to: '/parceiros/colaboradores/criar' })}>
                {t('partners.collaborators.list.new')}
              </Button>
            </div>
          ) : undefined
        }
      />

      <CollaboratorFilters
        searchValue={search.search ?? ''}
        status={statusFromActive(search.active)}
        situacao={search.status ?? ''}
        employment={search.employment ?? ''}
        role={search.role ?? ''}
        year={search.year !== undefined ? String(search.year) : ''}
        employmentOptions={EMPLOYMENT_RELATIONSHIPS.map((e) => ({ value: e, label: t(`partners.collaborators.employment.${e}`) }))}
        labels={{
          search: t('partners.collaborators.list.search'),
          all: t('partners.collaborators.filters.all'),
          active: t('partners.collaborators.filters.active'),
          inactive: t('partners.collaborators.filters.inactive'),
          toggle: t('partners.collaborators.filters.toggle'),
          situacao: t('partners.collaborators.filters.situacao'),
          employment: t('partners.collaborators.filters.employment'),
          role: t('partners.collaborators.filters.role'),
          year: t('partners.collaborators.filters.year'),
          escolaridade: t('partners.collaborators.filters.escolaridade'),
          raca: t('partners.collaborators.filters.raca'),
          idade: t('partners.collaborators.filters.idade'),
          genderIdentity: t('partners.collaborators.filters.genderIdentity'),
          programa: t('partners.collaborators.filters.programa'),
          deactivatedBy: t('partners.collaborators.filters.deactivatedBy'),
          gatedHint: t('partners.collaborators.filters.gatedHint'),
          allOption: t('partners.collaborators.filters.allOption'),
          preRegistration: t('partners.collaborators.registration.pre-registration'),
          complete: t('partners.collaborators.registration.complete'),
          apply: t('partners.collaborators.filters.apply'),
          export: t('partners.collaborators.filters.export'),
        }}
        onSearch={(value) =>
          void navigate({ to: '.', replace: true, search: (p) => ({ ...p, search: value || undefined, page: 1 }) })
        }
        onStatus={(s) =>
          void navigate({ to: '.', replace: true, search: (p) => ({ ...p, active: s === 'all' ? undefined : s === 'active', page: 1 }) })
        }
        onSituacao={(v) =>
          void navigate({ to: '.', replace: true, search: (p) => ({ ...p, status: v === '' ? undefined : v, page: 1 }) })
        }
        onEmployment={(v) =>
          void navigate({ to: '.', replace: true, search: (p) => ({ ...p, employment: v === '' ? undefined : (v as 'CLT' | 'PJ'), page: 1 }) })
        }
        onRole={(v) =>
          void navigate({ to: '.', replace: true, search: (p) => ({ ...p, role: v.trim() === '' ? undefined : v, page: 1 }) })
        }
        onYear={(v) =>
          void navigate({ to: '.', replace: true, search: (p) => ({ ...p, year: v.trim() === '' ? undefined : Number(v), page: 1 }) })
        }
        onExport={() => { /* TODO: export CSV de colaboradores (follow-up; ver gaps) */ }}
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
        onRowClick={(r) => void navigate({ to: '/parceiros/colaboradores/$id', params: { id: r.id } })}
      />

      <CollaboratorPaginator
        page={pageNum}
        totalPages={pages}
        perPage={search.limit}
        labels={{
          previous: t('partners.collaborators.paginator.previous'),
          next: t('partners.collaborators.paginator.next'),
          page: t('partners.collaborators.paginator.page'),
          perPage: t('partners.collaborators.paginator.perPage'),
        }}
        onPrev={() => void navigate({ to: '.', search: (p) => ({ ...p, page: Math.max(1, pageNum - 1) }) })}
        onNext={() => void navigate({ to: '.', search: (p) => ({ ...p, page: pageNum + 1 }) })}
        onPerPage={(perPage) => void navigate({ to: '.', search: (p) => ({ ...p, limit: perPage, page: 1 }) })}
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
