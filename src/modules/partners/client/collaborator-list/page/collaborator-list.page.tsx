import { useEffect, useRef, useState, type ReactNode } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { UploadIcon, PlusIcon, vars } from '#shared/ui/index.ts'
import {
  BrandDataTable,
  BrandChip,
  BrandNameCell,
  type BrandColumn,
  type BrandTableState,
} from '#shared/ui/brand/brand-data-table.component.tsx'
import { muted, numZero } from '#shared/ui/brand/brand-data-table.css.ts'
import { BrandPaginator } from '#shared/ui/brand/brand-paginator.component.tsx'
import {
  screen,
  header,
  headText,
  headTitle,
  headSubtitle,
  headActions,
  ghostButton,
  primaryButton,
} from '#shared/ui/brand/brand-page.css.ts'

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
import { exportTrigger } from '../components/collaborator-filters.css.ts'
import { ImportReportModal } from '../components/import-report-modal.component.tsx'
import { CollaboratorExportDropdown } from '#modules/partners/client/shared/collaborator-export-dropdown.component.tsx'
import { downloadCsvFile } from '#modules/partners/client/shared/download-file.ts'
import { PartnersPrintable } from '#modules/partners/client/shared/partners-printable.component.tsx'
import { contentWrap, contentWrapPrintHidden } from '#modules/partners/client/shared/export-print.css.ts'

const COLLAB_AVATAR = {
  bg: vars.color.partnerType.collaborator.background,
  fg: vars.color.partnerType.collaborator.text,
}
const GRID_TEMPLATE = 'minmax(220px,1.6fr) minmax(200px,1.4fr) .9fr 1fr 1.1fr .8fr 1fr'

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
  const { state, canCreate, importCommand, exportHistoryCommand } = useCollaboratorListBinding(
    search,
    (file) => {
      downloadCsvFile(file.filename, file.csv)
    },
  )
  const [printing, setPrinting] = useState(false)
  // Modal de relatório DERIVADO do comando (sem setState em efeito): aparece quando há resultado/erro e
  // o usuário ainda não dispensou; cada nova importação reabre.
  const [reportDismissed, setReportDismissed] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!printing) return
    const id = setTimeout(() => {
      window.print()
      setPrinting(false)
    }, 0)
    return () => {
      clearTimeout(id)
    }
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

  const tableState = toTableState(state)
  const pageNum = search.page
  const pages = state.status === 'ready' ? totalPages(state.meta) : 1
  const rows = state.status === 'ready' ? state.rows : []

  const columns: readonly BrandColumn<CollaboratorRow>[] = [
    {
      key: 'name',
      header: t('partners.collaborators.columns.legalRepresentative'),
      cell: (r) => (
        <BrandNameCell
          name={r.name}
          initials={initials(r.name)}
          bg={COLLAB_AVATAR.bg}
          fg={COLLAB_AVATAR.fg}
        />
      ),
    },
    { key: 'email', header: t('partners.collaborators.columns.email'), cell: (r) => r.email },
    {
      key: 'area',
      header: t('partners.collaborators.columns.occupationArea'),
      cell: (r) => <span className={muted}>{areaLabel(r.occupationArea)}</span>,
    },
    {
      key: 'contracts',
      header: t('partners.collaborators.columns.contracts'),
      cell: (r) => <span className={r.contractCount === 0 ? numZero : undefined}>{r.contractCount}</span>,
    },
    { key: 'role', header: t('partners.collaborators.columns.role'), cell: (r) => r.role },
    {
      key: 'status',
      header: t('partners.collaborators.columns.status'),
      cell: (r) => (
        <BrandChip
          tone={r.activation === 'active' ? 'ok' : 'danger'}
          label={t(`partners.collaborators.status.${r.activation}`)}
        />
      ),
    },
    {
      key: 'situacao',
      header: t('partners.collaborators.columns.situacao'),
      cell: (r) => (
        <BrandChip
          tone={r.registration === 'pre-registration' ? 'warn' : 'cad'}
          label={t(`partners.collaborators.registration.${r.registration}`)}
        />
      ),
    },
  ]

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
        <div className={header}>
          <div className={headText}>
            <h1 className={headTitle}>{t('partners.collaborators.list.title')}</h1>
            <p className={headSubtitle}>{t('partners.collaborators.list.subtitle')}</p>
          </div>
          {canCreate ? (
            <div className={headActions}>
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
                className={ghostButton}
                title={t('partners.collaborators.list.import')}
                disabled={importCommand.running}
                onClick={() => {
                  fileInputRef.current?.click()
                }}
              >
                <UploadIcon size={16} />
                {importCommand.running
                  ? t('partners.collaborators.import.running')
                  : t('partners.collaborators.list.import')}
              </button>
              <button
                type="button"
                className={primaryButton}
                onClick={() => void navigate({ to: '/parceiros/colaboradores/criar' })}
              >
                <PlusIcon size={16} />
                {t('partners.collaborators.list.new')}
              </button>
            </div>
          ) : null}
        </div>

        <CollaboratorFilters
          searchValue={search.search ?? ''}
          status={statusFromActive(search.active)}
          situacao={search.status ?? ''}
          employment={search.employment ?? ''}
          role={search.role ?? ''}
          year={search.year !== undefined ? String(search.year) : ''}
          employmentOptions={EMPLOYMENT_RELATIONSHIPS.map((e) => ({
            value: e,
            label: t(`partners.collaborators.employment.${e}`),
          }))}
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
              triggerClassName={exportTrigger}
              exportLabel={t('partners.collaborators.filters.export')}
              tudoLabel={t('partners.collaborators.export.tudo')}
              historicoLabel={t('partners.collaborators.export.historico')}
              templateLabel={t('partners.collaborators.export.template')}
              onPrint={() => {
                setPrinting(true)
              }}
              onHistory={() => {
                exportHistoryCommand.execute()
              }}
              historicoRunning={exportHistoryCommand.running}
            />
          }
          onSearch={(value) =>
            void navigate({
              to: '.',
              replace: true,
              search: (p) => ({ ...p, search: value || undefined, page: 1 }),
            })
          }
          onStatus={(s) =>
            void navigate({
              to: '.',
              replace: true,
              search: (p) => ({ ...p, active: s === 'all' ? undefined : s === 'active', page: 1 }),
            })
          }
          onSituacao={(v) =>
            void navigate({
              to: '.',
              replace: true,
              search: (p) => ({ ...p, status: v === '' ? undefined : v, page: 1 }),
            })
          }
          onEmployment={(v) =>
            void navigate({
              to: '.',
              replace: true,
              search: (p) => ({ ...p, employment: v === '' ? undefined : (v as 'CLT' | 'PJ'), page: 1 }),
            })
          }
          onRole={(v) =>
            void navigate({
              to: '.',
              replace: true,
              search: (p) => ({ ...p, role: v.trim() === '' ? undefined : v, page: 1 }),
            })
          }
          onYear={(v) =>
            void navigate({
              to: '.',
              replace: true,
              search: (p) => ({ ...p, year: v.trim() === '' ? undefined : Number(v), page: 1 }),
            })
          }
          onClear={() =>
            void navigate({
              to: '.',
              replace: true,
              search: (p) => ({
                ...p,
                status: undefined,
                employment: undefined,
                role: undefined,
                year: undefined,
                page: 1,
              }),
            })
          }
          onClearAll={() =>
            void navigate({
              to: '.',
              replace: true,
              search: (p) => ({
                ...p,
                active: undefined,
                status: undefined,
                employment: undefined,
                role: undefined,
                year: undefined,
                page: 1,
              }),
            })
          }
        />

        <BrandDataTable<CollaboratorRow>
          columns={columns}
          gridTemplate={GRID_TEMPLATE}
          state={tableState}
          rowKey={(r) => r.id}
          caption={t('partners.collaborators.list.title')}
          emptyLabel={
            hasFilters ? t('partners.collaborators.list.no-results') : t('partners.collaborators.list.empty')
          }
          loadingLabel={t('partners.collaborators.list.loading')}
          onRowClick={(r) => void navigate({ to: '/parceiros/colaboradores/$id', params: { id: r.id } })}
        />

        <BrandPaginator
          page={pageNum}
          totalPages={pages}
          perPage={search.limit}
          labels={{
            previous: t('partners.collaborators.paginator.previous'),
            next: t('partners.collaborators.paginator.next'),
            page: t('partners.collaborators.paginator.page'),
            of: t('partners.collaborators.paginator.of'),
            perPage: t('partners.collaborators.paginator.perPage'),
          }}
          onPrev={() => void navigate({ to: '.', search: (p) => ({ ...p, page: Math.max(1, pageNum - 1) }) })}
          onNext={() => void navigate({ to: '.', search: (p) => ({ ...p, page: pageNum + 1 }) })}
          onPerPage={(perPage) =>
            void navigate({ to: '.', search: (p) => ({ ...p, limit: perPage, page: 1 }) })
          }
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
        onClose={() => {
          setReportDismissed(true)
          importCommand.reset()
        }}
      />
    </div>
  )
}

function toTableState(state: CollaboratorListState): BrandTableState<CollaboratorRow> {
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
