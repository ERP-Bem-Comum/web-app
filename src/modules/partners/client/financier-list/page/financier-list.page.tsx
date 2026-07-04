import { useEffect, useState, type ReactNode } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { PlusIcon, formatMask, initialsFrom, vars } from '#shared/ui/index.ts'
import {
  BrandDataTable,
  BrandChip,
  BrandNameCell,
  type BrandColumn,
  type BrandTableState,
} from '#shared/ui/brand/brand-data-table.component.tsx'
import { numZero } from '#shared/ui/brand/brand-data-table.css.ts'
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

import { useFinancierListBinding } from '../financier-list.binding.ts'
import { totalPages, type FinancierListState, type FinancierRow } from '../financier-list.view-model.ts'
import { FinancierFilters, type StatusFilter } from '../components/financier-filters.component.tsx'
import { exportTrigger } from '../components/financier-filters.css.ts'
import { PartnersExportDropdown } from '#modules/partners/client/shared/partners-export-dropdown.component.tsx'
import { PartnersPrintable } from '#modules/partners/client/shared/partners-printable.component.tsx'
import { contentWrap, contentWrapPrintHidden } from '#modules/partners/client/shared/export-print.css.ts'
import { cnpjCell } from './financier-list.css.ts'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/parceiros/financiadores/')

const AVATAR = {
  bg: vars.color.partnerType.financier.background,
  fg: vars.color.partnerType.financier.text,
}
const GRID_TEMPLATE = 'minmax(200px,1.6fr) minmax(160px,1.4fr) 1.1fr 1.1fr .8fr 1fr'

function formatCnpj(digits: string): string {
  if (digits.length !== 14) return digits
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

function statusFromActive(active: boolean | undefined): StatusFilter {
  if (active === undefined) return 'all'
  return active ? 'active' : 'inactive'
}

export function FinancierListPage(): ReactNode {
  const search = routeApi.useSearch()
  const navigate = useNavigate()
  const { state, canCreate } = useFinancierListBinding(search)
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

  const hasFilters = (search.search ?? '') !== '' || search.active !== undefined

  const columns: readonly BrandColumn<FinancierRow>[] = [
    {
      key: 'corporateName',
      header: t('partners.financiers.columns.corporateName'),
      cell: (r) => (
        <BrandNameCell
          name={r.corporateName}
          initials={initialsFrom(r.corporateName)}
          bg={AVATAR.bg}
          fg={AVATAR.fg}
        />
      ),
    },
    {
      key: 'legalRepresentative',
      header: t('partners.financiers.columns.legalRepresentative'),
      cell: (r) => r.legalRepresentative,
    },
    {
      key: 'cnpj',
      header: t('partners.financiers.columns.cnpj'),
      cell: (r) => <span className={cnpjCell}>{formatCnpj(r.cnpj)}</span>,
    },
    {
      key: 'telephone',
      header: t('partners.financiers.columns.telephone'),
      cell: (r) => formatMask('phone', r.telephone),
    },
    {
      key: 'contracts',
      header: t('partners.financiers.columns.contracts'),
      cell: (r) => <span className={r.contractCount === 0 ? numZero : undefined}>{r.contractCount}</span>,
    },
    {
      key: 'status',
      header: t('partners.financiers.columns.status'),
      cell: (r) => (
        <BrandChip
          tone={r.activation === 'active' ? 'ok' : 'danger'}
          label={t(`partners.financiers.status.${r.activation}`)}
        />
      ),
    },
  ]

  const tableState = toTableState(state)
  const pageNum = search.page
  const pages = state.status === 'ready' ? totalPages(state.meta) : 1
  const rows = state.status === 'ready' ? state.rows : []

  const exportColumns: readonly string[] = [
    t('partners.financiers.columns.corporateName'),
    t('partners.financiers.columns.legalRepresentative'),
    t('partners.financiers.columns.cnpj'),
    t('partners.financiers.columns.telephone'),
    t('partners.financiers.columns.status'),
  ]
  const exportRows: readonly (readonly string[])[] = rows.map((r) => [
    r.corporateName,
    r.legalRepresentative,
    formatCnpj(r.cnpj),
    formatMask('phone', r.telephone),
    t(`partners.financiers.status.${r.activation}`),
  ])

  return (
    <div className={screen}>
      <div className={printing ? contentWrapPrintHidden : contentWrap}>
        <div className={header}>
          <div className={headText}>
            <h1 className={headTitle}>{t('partners.financiers.list.title')}</h1>
            <p className={headSubtitle}>{t('partners.financiers.list.subtitle')}</p>
          </div>
          {canCreate ? (
            <div className={headActions}>
              <button
                type="button"
                className={primaryButton}
                onClick={() => void navigate({ to: '/parceiros/financiadores/criar' })}
              >
                <PlusIcon size={16} />
                {t('partners.financiers.list.new')}
              </button>
            </div>
          ) : null}
        </div>

        <FinancierFilters
          searchValue={search.search ?? ''}
          status={statusFromActive(search.active)}
          labels={{
            search: t('partners.financiers.list.search'),
            all: t('partners.financiers.filters.all'),
            active: t('partners.financiers.filters.active'),
            inactive: t('partners.financiers.filters.inactive'),
          }}
          exportSlot={
            <PartnersExportDropdown
              triggerClassName={exportTrigger}
              exportLabel={t('partners.export.label')}
              filenameBase="financiadores"
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
        />

        <BrandDataTable<FinancierRow>
          columns={columns}
          gridTemplate={GRID_TEMPLATE}
          state={tableState}
          rowKey={(r) => r.id}
          caption={t('partners.financiers.list.title')}
          emptyLabel={
            hasFilters ? t('partners.financiers.list.no-results') : t('partners.financiers.list.empty')
          }
          loadingLabel={t('partners.financiers.list.loading')}
          onRowClick={(r) => void navigate({ to: '/parceiros/financiadores/$id', params: { id: r.id } })}
        />

        <BrandPaginator
          page={pageNum}
          totalPages={pages}
          perPage={search.limit}
          labels={{
            previous: t('partners.financiers.paginator.previous'),
            next: t('partners.financiers.paginator.next'),
            page: t('partners.financiers.paginator.page'),
            of: t('partners.financiers.paginator.of'),
            perPage: t('partners.financiers.paginator.perPage'),
          }}
          onPrev={() => void navigate({ to: '.', search: (p) => ({ ...p, page: Math.max(1, pageNum - 1) }) })}
          onNext={() => void navigate({ to: '.', search: (p) => ({ ...p, page: pageNum + 1 }) })}
          onPerPage={(perPage) =>
            void navigate({ to: '.', search: (p) => ({ ...p, limit: perPage, page: 1 }) })
          }
        />
      </div>

      <PartnersPrintable
        title={t('partners.financiers.list.title')}
        emittedLabel={t('partners.export.count').replace('{n}', String(rows.length))}
        columns={exportColumns}
        rows={exportRows}
        emptyLabel={t('partners.financiers.list.empty')}
      />
    </div>
  )
}

function toTableState(state: FinancierListState): BrandTableState<FinancierRow> {
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
