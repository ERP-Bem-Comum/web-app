import { useEffect, useState, type ReactNode } from 'react'
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
import { ActFilters, type StatusFilter, type TransferFilter } from '../components/act-filters.component.tsx'
import { ActPaginator } from '../components/act-paginator.component.tsx'
import { PartnersExportDropdown } from '#modules/partners/client/shared/partners-export-dropdown.component.tsx'
import { PartnersPrintable } from '#modules/partners/client/shared/partners-printable.component.tsx'
import { contentWrap, contentWrapPrintHidden } from '#modules/partners/client/shared/export-print.css.ts'
import { screen } from './act-list.css.ts'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/parceiros/atos/')

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
    const id = setTimeout(() => { window.print(); setPrinting(false) }, 0)
    return () => { clearTimeout(id) }
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

  const columns: readonly Column<ActRow>[] = [
    { key: 'number', header: t('partners.acts.columns.actNumber'), cell: (r) => r.actNumber },
    { key: 'partner', header: t('partners.acts.columns.partner'), cell: (r) => r.corporateName },
    { key: 'title', header: t('partners.acts.columns.objectTitle'), cell: (r) => r.name },
    { key: 'area', header: t('partners.acts.columns.occupationArea'), cell: (r) => areaLabel(r.occupationArea) },
    { key: 'transfer', header: t('partners.acts.columns.hasFinancialTransfer'), cell: (r) => transferLabel(r.hasFinancialTransfer) },
    {
      key: 'status',
      header: t('partners.acts.columns.status'),
      cell: (r) => (
        <Badge variant={r.active ? 'active' : 'outro'}>
          {t(`partners.acts.status.${r.active ? 'active' : 'inactive'}`)}
        </Badge>
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
          apply: t('partners.acts.filters.apply'),
        }}
        exportSlot={
          <PartnersExportDropdown
            exportLabel={t('partners.acts.filters.export')}
            filenameBase="acordos"
            headers={exportColumns}
            rows={exportRows}
            onPrint={() => { setPrinting(true) }}
          />
        }
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
        onTransfer={(tr) =>
          void navigate({
            to: '.',
            replace: true,
            search: (p) => ({ ...p, hasFinancialTransfer: tr === 'all' ? undefined : tr === 'yes', page: 1 }),
          })
        }
        onArea={(a) =>
          void navigate({
            to: '.',
            replace: true,
            search: (p) => ({ ...p, occupationArea: a === '' ? undefined : (a as OccupationArea), page: 1 }),
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
        onRowClick={(r) => void navigate({ to: '/parceiros/atos/$id', params: { id: r.id } })}
      />

      <ActPaginator
        page={pageNum}
        totalPages={pages}
        perPage={search.limit}
        labels={{
          previous: t('partners.acts.paginator.previous'),
          next: t('partners.acts.paginator.next'),
          page: t('partners.acts.paginator.page'),
          perPage: t('partners.acts.paginator.perPage'),
        }}
        onPrev={() => void navigate({ to: '.', search: (p) => ({ ...p, page: Math.max(1, pageNum - 1) }) })}
        onNext={() => void navigate({ to: '.', search: (p) => ({ ...p, page: pageNum + 1 }) })}
        onPerPage={(perPage) => void navigate({ to: '.', search: (p) => ({ ...p, limit: perPage, page: 1 }) })}
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
