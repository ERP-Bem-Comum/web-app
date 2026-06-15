import { useEffect, useRef, useState, type ReactNode } from 'react'
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
import { ImportReportModal } from '../components/import-report-modal.component.tsx'
import { CollaboratorExportDropdown } from '#modules/partners/client/shared/collaborator-export-dropdown.component.tsx'
import { PartnersPrintable } from '#modules/partners/client/shared/partners-printable.component.tsx'
import { contentWrap, contentWrapPrintHidden } from '#modules/partners/client/shared/export-print.css.ts'
import { screen, toolbarActions, importButton, nameCell, avatar, nameText } from './collaborator-list.css.ts'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/parceiros/colaboradores/')

/** Iniciais (até 2) do nome para o avatar da grid. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '—'
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return `${first}${last}`
}

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
  const { state, canCreate, importCommand } = useCollaboratorListBinding(search)
  const [printing, setPrinting] = useState(false)
  // Modal de relatório DERIVADO do comando (sem setState em efeito): aparece quando há resultado/erro e
  // o usuário ainda não dispensou; cada nova importação reabre.
  const [reportDismissed, setReportDismissed] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!printing) return
    const id = setTimeout(() => { window.print(); setPrinting(false) }, 0)
    return () => { clearTimeout(id) }
  }, [printing])

  const reportOpen = !reportDismissed && (importCommand.result !== null || importCommand.errorTag !== null)

  const onPickFile = async (file: File): Promise<void> => {
    setReportDismissed(false)
    const csv = await file.text()
    importCommand.execute({ filename: file.name, csv })
  }

  const hasFilters =
    (search.search ?? '') !== '' ||
    search.active !== undefined ||
    search.status !== undefined ||
    search.area !== undefined ||
    search.employment !== undefined ||
    (search.role ?? '') !== '' ||
    search.year !== undefined

  const columns: readonly Column<CollaboratorRow>[] = [
    {
      key: 'name',
      header: t('partners.collaborators.columns.legalRepresentative'),
      cell: (r) => (
        <div className={nameCell}>
          <span className={avatar} aria-hidden="true">{initials(r.name)}</span>
          <span className={nameText}>{r.name}</span>
        </div>
      ),
    },
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
      // Status (ativação) — coluna própria.
      key: 'status',
      header: t('partners.collaborators.columns.status'),
      cell: (r) => (
        <Badge variant={r.activation === 'active' ? 'active' : 'terminated'} uppercase size="sm">
          {t(`partners.collaborators.status.${r.activation}`)}
        </Badge>
      ),
    },
    {
      // Situação cadastral (pré-cadastro/cadastrado) — coluna própria.
      key: 'situacao',
      header: t('partners.collaborators.columns.situacao'),
      cell: (r) => (
        <Badge variant={r.registration === 'pre-registration' ? 'pending' : 'finished'} uppercase size="sm">
          {t(`partners.collaborators.registration.${r.registration}`)}
        </Badge>
      ),
    },
  ]

  const tableState = toTableState(state)
  const pageNum = search.page
  const pages = state.status === 'ready' ? totalPages(state.meta) : 1
  const rows = state.status === 'ready' ? state.rows : []

  const exportColumns: readonly string[] = [
    t('partners.collaborators.columns.legalRepresentative'),
    t('partners.collaborators.columns.email'),
    t('partners.collaborators.columns.occupationArea'),
    t('partners.collaborators.columns.role'),
    t('partners.collaborators.columns.status'),
    t('partners.collaborators.columns.situacao'),
  ]
  const exportRows: readonly (readonly string[])[] = rows.map((r) => [
    r.name,
    r.email,
    areaLabel(r.occupationArea),
    r.role,
    t(`partners.collaborators.status.${r.activation}`),
    t(`partners.collaborators.registration.${r.registration}`),
  ])

  return (
    <div className={screen}>
      <div className={printing ? contentWrapPrintHidden : contentWrap}>
      <PageHeader
        title={t('partners.collaborators.list.title')}
        subtitle={t('partners.collaborators.list.subtitle')}
        actions={
          canCreate ? (
            <div className={toolbarActions}>
              {/* Importar CSV/Excel — abre o seletor de arquivo → importCsv → relatório (criados/falhas). */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void onPickFile(f)
                  e.target.value = ''
                }}
              />
              <button
                type="button"
                className={importButton}
                title={t('partners.collaborators.list.import')}
                disabled={importCommand.running}
                onClick={() => { fileInputRef.current?.click() }}
              >
                {importCommand.running ? t('partners.collaborators.import.running') : t('partners.collaborators.list.import')}
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
          advancedTitle: t('partners.collaborators.filters.advancedTitle'),
          advancedSubtitle: t('partners.collaborators.filters.advancedSubtitle'),
          collapse: t('partners.collaborators.filters.collapse'),
          clear: t('partners.collaborators.filters.clear'),
          groupPessoais: t('partners.collaborators.filters.groupPessoais'),
          groupContratuais: t('partners.collaborators.filters.groupContratuais'),
          groupSituacao: t('partners.collaborators.filters.groupSituacao'),
          applied: t('partners.collaborators.filters.applied'),
          statusLabel: t('partners.collaborators.columns.status'),
          clearAll: t('partners.collaborators.filters.clearAll'),
          removeFilter: t('partners.collaborators.filters.removeFilter'),
        }}
        exportSlot={
          <CollaboratorExportDropdown
            exportLabel={t('partners.collaborators.filters.export')}
            tudoLabel={t('partners.collaborators.export.tudo')}
            historicoLabel={t('partners.collaborators.export.historico')}
            historicoGatedHint={t('partners.collaborators.export.historico.gated')}
            templateLabel={t('partners.collaborators.export.template')}
            onPrint={() => { setPrinting(true) }}
          />
        }
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
        onClear={() =>
          void navigate({
            to: '.',
            replace: true,
            search: (p) => ({ ...p, status: undefined, employment: undefined, role: undefined, year: undefined, page: 1 }),
          })
        }
        onClearAll={() =>
          void navigate({
            to: '.',
            replace: true,
            search: (p) => ({ ...p, active: undefined, status: undefined, employment: undefined, role: undefined, year: undefined, page: 1 }),
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

      <PartnersPrintable
        title={t('partners.collaborators.list.title')}
        emittedLabel={t('partners.export.count').replace('{n}', String(rows.length))}
        columns={exportColumns}
        rows={exportRows}
        emptyLabel={t('partners.collaborators.list.empty')}
      />

      <ImportReportModal
        open={reportOpen}
        report={importCommand.result}
        errorTag={importCommand.errorTag}
        onClose={() => { setReportDismissed(true); importCommand.reset() }}
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
