import { useEffect, useState, type ReactNode } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { PlusIcon, initialsFrom, vars } from '#shared/ui/index.ts'
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
  primaryButton,
} from '#shared/ui/brand/brand-page.css.ts'

import { useActListBinding } from '../act-list.binding.ts'
import {
  OCCUPATION_AREAS,
  totalPages,
  type ActListState,
  type ActRow,
  type OccupationArea,
} from '../act-list.view-model.ts'
import { ActFilters, type StatusFilter, type TransferFilter } from '../components/act-filters.component.tsx'
import { exportTrigger } from '../components/act-filters.css.ts'
import { PartnersExportDropdown } from '#modules/partners/client/shared/partners-export-dropdown.component.tsx'
import { PartnersPrintable } from '#modules/partners/client/shared/partners-printable.component.tsx'
import { contentWrap, contentWrapPrintHidden } from '#modules/partners/client/shared/export-print.css.ts'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/parceiros/atos/')

const AVATAR = { bg: vars.color.partnerType.act.background, fg: vars.color.partnerType.act.text }
const GRID_TEMPLATE = '.9fr minmax(180px,1.5fr) minmax(180px,1.5fr) 1fr .9fr .8fr 1fr'

function statusFromActive(active: boolean | undefined): StatusFilter {
  if (active === undefined) return 'all'
  return active ? 'active' : 'inactive'
}
function transferFrom(value: boolean | undefined): TransferFilter {
  if (value === undefined) return 'all'
  return value ? 'yes' : 'no'
}

export function ActListPage(): ReactNode {
  const search = routeApi.useSearch()
  const navigate = useNavigate()
  const { state, canCreate } = useActListBinding(search)
  const [printing, setPrinting] = useState(false)

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

  const hasFilters =
    (search.search ?? '') !== '' ||
    search.active !== undefined ||
    search.hasFinancialTransfer !== undefined ||
    search.occupationArea !== undefined

  const areaLabel = (a: string): string =>
    (OCCUPATION_AREAS as readonly string[]).includes(a) ? t(`partners.acts.area.${a}`) : '—'
  const transferLabel = (v: boolean): string =>
    v ? t('partners.acts.transfer.yes') : t('partners.acts.transfer.no')

  const columns: readonly BrandColumn<ActRow>[] = [
    { key: 'number', header: t('partners.acts.columns.actNumber'), cell: (r) => r.actNumber },
    {
      key: 'partner',
      header: t('partners.acts.columns.partner'),
      cell: (r) => (
        <BrandNameCell
          name={r.corporateName}
          initials={initialsFrom(r.corporateName)}
          bg={AVATAR.bg}
          fg={AVATAR.fg}
        />
      ),
    },
    { key: 'title', header: t('partners.acts.columns.objectTitle'), cell: (r) => r.name },
    {
      key: 'area',
      header: t('partners.acts.columns.occupationArea'),
      cell: (r) => <span className={muted}>{areaLabel(r.occupationArea)}</span>,
    },
    {
      key: 'transfer',
      header: t('partners.acts.columns.hasFinancialTransfer'),
      cell: (r) => transferLabel(r.hasFinancialTransfer),
    },
    {
      key: 'contracts',
      header: t('partners.acts.columns.contracts'),
      cell: (r) => <span className={r.contractCount === 0 ? numZero : undefined}>{r.contractCount}</span>,
    },
    {
      key: 'status',
      header: t('partners.acts.columns.status'),
      cell: (r) => (
        <BrandChip
          tone={r.active ? 'ok' : 'danger'}
          label={t(`partners.acts.status.${r.active ? 'active' : 'inactive'}`)}
        />
      ),
    },
  ]

  const tableState = toTableState(state)
  const pageNum = search.page
  const pages = state.status === 'ready' ? totalPages(state.meta) : 1
  const rows = state.status === 'ready' ? state.rows : []

  const exportColumns: readonly string[] = [
    t('partners.acts.columns.actNumber'),
    t('partners.acts.columns.partner'),
    t('partners.acts.columns.objectTitle'),
    t('partners.acts.columns.occupationArea'),
    t('partners.acts.columns.hasFinancialTransfer'),
    t('partners.acts.columns.status'),
  ]
  const exportRows: readonly (readonly string[])[] = rows.map((r) => [
    r.actNumber,
    r.corporateName,
    r.name,
    areaLabel(r.occupationArea),
    transferLabel(r.hasFinancialTransfer),
    t(`partners.acts.status.${r.active ? 'active' : 'inactive'}`),
  ])

  return (
    <div className={screen}>
      <div className={printing ? contentWrapPrintHidden : contentWrap}>
        <div className={header}>
          <div className={headText}>
            <h1 className={headTitle}>{t('partners.acts.list.title')}</h1>
            <p className={headSubtitle}>{t('partners.acts.list.subtitle')}</p>
          </div>
          {canCreate ? (
            <div className={headActions}>
              <button
                type="button"
                className={primaryButton}
                onClick={() => void navigate({ to: '/parceiros/atos/criar' })}
              >
                <PlusIcon size={16} />
                {t('partners.acts.list.new')}
              </button>
            </div>
          ) : null}
        </div>

        <ActFilters
          searchValue={search.search ?? ''}
          status={statusFromActive(search.active)}
          transfer={transferFrom(search.hasFinancialTransfer)}
          area={search.occupationArea ?? ''}
          areaOptions={OCCUPATION_AREAS.map((a) => ({ value: a, label: t(`partners.acts.area.${a}`) }))}
          labels={{
            search: t('partners.acts.list.search'),
            all: t('partners.acts.filters.all'),
            active: t('partners.acts.filters.active'),
            inactive: t('partners.acts.filters.inactive'),
            toggle: t('partners.acts.filters.toggle'),
            hasTransfer: t('partners.acts.filters.hasTransfer'),
            transferYes: t('partners.acts.filters.transferYes'),
            transferNo: t('partners.acts.filters.transferNo'),
            area: t('partners.acts.filters.area'),
            allOption: t('partners.acts.filters.allOption'),
            apply: t('partners.filters.apply'),
            statusLabel: t('partners.acts.columns.status'),
            advancedTitle: t('partners.filters.advancedTitle'),
            advancedSubtitle: t('partners.acts.filters.advancedSubtitle'),
            collapse: t('partners.filters.collapse'),
            clear: t('partners.filters.clear'),
            clearAll: t('partners.filters.clearAll'),
            removeFilter: t('partners.filters.removeFilter'),
            applied: t('partners.filters.applied'),
          }}
          exportSlot={
            <PartnersExportDropdown
              triggerClassName={exportTrigger}
              exportLabel={t('partners.acts.filters.export')}
              filenameBase="acordos"
              headers={exportColumns}
              rows={exportRows}
              onPrint={() => {
                setPrinting(true)
              }}
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
          onTransfer={(tr) =>
            void navigate({
              to: '.',
              replace: true,
              search: (p) => ({
                ...p,
                hasFinancialTransfer: tr === 'all' ? undefined : tr === 'yes',
                page: 1,
              }),
            })
          }
          onArea={(a) =>
            void navigate({
              to: '.',
              replace: true,
              search: (p) => ({
                ...p,
                occupationArea: a === '' ? undefined : (a as OccupationArea),
                page: 1,
              }),
            })
          }
          onClear={() =>
            void navigate({
              to: '.',
              replace: true,
              search: (p) => ({ ...p, hasFinancialTransfer: undefined, occupationArea: undefined, page: 1 }),
            })
          }
          onClearAll={() =>
            void navigate({
              to: '.',
              replace: true,
              search: (p) => ({
                ...p,
                active: undefined,
                hasFinancialTransfer: undefined,
                occupationArea: undefined,
                page: 1,
              }),
            })
          }
        />

        <BrandDataTable<ActRow>
          columns={columns}
          gridTemplate={GRID_TEMPLATE}
          state={tableState}
          rowKey={(r) => r.id}
          caption={t('partners.acts.list.title')}
          emptyLabel={hasFilters ? t('partners.acts.list.no-results') : t('partners.acts.list.empty')}
          loadingLabel={t('partners.acts.list.loading')}
          onRowClick={(r) => void navigate({ to: '/parceiros/atos/$id', params: { id: r.id } })}
        />

        <BrandPaginator
          page={pageNum}
          totalPages={pages}
          perPage={search.limit}
          labels={{
            previous: t('partners.acts.paginator.previous'),
            next: t('partners.acts.paginator.next'),
            page: t('partners.acts.paginator.page'),
            of: t('partners.acts.paginator.of'),
            perPage: t('partners.acts.paginator.perPage'),
          }}
          onPrev={() => void navigate({ to: '.', search: (p) => ({ ...p, page: Math.max(1, pageNum - 1) }) })}
          onNext={() => void navigate({ to: '.', search: (p) => ({ ...p, page: pageNum + 1 }) })}
          onPerPage={(perPage) =>
            void navigate({ to: '.', search: (p) => ({ ...p, limit: perPage, page: 1 }) })
          }
        />
      </div>

      <PartnersPrintable
        title={t('partners.acts.list.title')}
        emittedLabel={t('partners.export.count').replace('{n}', String(rows.length))}
        columns={exportColumns}
        rows={exportRows}
        emptyLabel={t('partners.acts.list.empty')}
      />
    </div>
  )
}

function toTableState(state: ActListState): BrandTableState<ActRow> {
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
