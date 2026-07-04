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

import { useSupplierListBinding } from '../supplier-list.binding.ts'
import { totalPages, type SupplierListState, type SupplierRow } from '../supplier-list.view-model.ts'
import { SupplierFilters, type StatusFilter } from '../components/supplier-filters.component.tsx'
import { exportTrigger } from '../components/supplier-filters.css.ts'
import { PartnersExportDropdown } from '#modules/partners/client/shared/partners-export-dropdown.component.tsx'
import { PartnersPrintable } from '#modules/partners/client/shared/partners-printable.component.tsx'
import { contentWrap, contentWrapPrintHidden } from '#modules/partners/client/shared/export-print.css.ts'
import { cnpjCell } from './supplier-list.css.ts'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/parceiros/fornecedores/')

const AVATAR = {
  bg: vars.color.partnerType.supplier.background,
  fg: vars.color.partnerType.supplier.text,
}
const GRID_TEMPLATE = 'minmax(220px,1.8fr) minmax(200px,1.6fr) 1.1fr .9fr 1fr'

/** CNPJ (14 dígitos) → máscara; entrada inesperada volta crua. */
function formatCnpj(digits: string): string {
  if (digits.length !== 14) return digits
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

function statusFromActive(active: boolean | undefined): StatusFilter {
  if (active === undefined) return 'all'
  return active ? 'active' : 'inactive'
}

export function SupplierListPage(): ReactNode {
  const search = routeApi.useSearch()
  const navigate = useNavigate()
  const { state, canCreate, categories } = useSupplierListBinding(search)
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
    (search.search ?? '') !== '' || search.active !== undefined || (search.categories?.length ?? 0) > 0

  const columns: readonly BrandColumn<SupplierRow>[] = [
    {
      key: 'name',
      header: t('partners.suppliers.columns.name'),
      cell: (r) => (
        <BrandNameCell name={r.name} initials={initialsFrom(r.name)} bg={AVATAR.bg} fg={AVATAR.fg} />
      ),
    },
    { key: 'email', header: t('partners.suppliers.columns.email'), cell: (r) => r.email },
    {
      key: 'cnpj',
      header: t('partners.suppliers.columns.cnpj'),
      cell: (r) => <span className={cnpjCell}>{formatCnpj(r.cnpj)}</span>,
    },
    {
      key: 'contracts',
      header: t('partners.suppliers.columns.contracts'),
      cell: (r) => <span className={r.contractCount === 0 ? numZero : undefined}>{r.contractCount}</span>,
    },
    {
      key: 'status',
      header: t('partners.suppliers.columns.status'),
      cell: (r) => (
        <BrandChip
          tone={r.activation === 'active' ? 'ok' : 'danger'}
          label={t(`partners.suppliers.status.${r.activation}`)}
        />
      ),
    },
  ]

  const tableState = toTableState(state)
  const pageNum = search.page
  const pages = state.status === 'ready' ? totalPages(state.meta) : 1
  const rows = state.status === 'ready' ? state.rows : []

  const exportColumns: readonly string[] = [
    t('partners.suppliers.columns.name'),
    t('partners.suppliers.columns.email'),
    t('partners.suppliers.columns.cnpj'),
    t('partners.suppliers.columns.status'),
  ]
  const exportRows: readonly (readonly string[])[] = rows.map((r) => [
    r.name,
    r.email,
    formatCnpj(r.cnpj),
    t(`partners.suppliers.status.${r.activation}`),
  ])

  return (
    <div className={screen}>
      <div className={printing ? contentWrapPrintHidden : contentWrap}>
        <div className={header}>
          <div className={headText}>
            <h1 className={headTitle}>{t('partners.suppliers.list.title')}</h1>
            <p className={headSubtitle}>{t('partners.suppliers.list.subtitle')}</p>
          </div>
          {canCreate ? (
            <div className={headActions}>
              <button
                type="button"
                className={primaryButton}
                onClick={() => void navigate({ to: '/parceiros/fornecedores/criar' })}
              >
                <PlusIcon size={16} />
                {t('partners.suppliers.list.new')}
              </button>
            </div>
          ) : null}
        </div>

        <SupplierFilters
          searchValue={search.search ?? ''}
          status={statusFromActive(search.active)}
          category={search.categories?.[0] ?? ''}
          categories={categories}
          labels={{
            search: t('partners.suppliers.list.search'),
            all: t('partners.suppliers.filters.all'),
            active: t('partners.suppliers.filters.active'),
            inactive: t('partners.suppliers.filters.inactive'),
            toggle: t('partners.suppliers.filters.toggle'),
            category: t('partners.suppliers.filters.category'),
            contractStatus: t('partners.suppliers.filters.contractStatus'),
            allOption: t('partners.suppliers.filters.allOption'),
            gatedHint: t('partners.suppliers.filters.gatedHint'),
            apply: t('partners.filters.apply'),
            statusLabel: t('partners.suppliers.columns.status'),
            advancedTitle: t('partners.filters.advancedTitle'),
            advancedSubtitle: t('partners.suppliers.filters.advancedSubtitle'),
            collapse: t('partners.filters.collapse'),
            clear: t('partners.filters.clear'),
            clearAll: t('partners.filters.clearAll'),
            removeFilter: t('partners.filters.removeFilter'),
            applied: t('partners.filters.applied'),
          }}
          exportSlot={
            <PartnersExportDropdown
              triggerClassName={exportTrigger}
              exportLabel={t('partners.suppliers.filters.export')}
              filenameBase="fornecedores"
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
          onCategory={(c) =>
            void navigate({
              to: '.',
              replace: true,
              search: (p) => ({ ...p, categories: c ? [c] : undefined, page: 1 }),
            })
          }
          onClear={() =>
            void navigate({
              to: '.',
              replace: true,
              search: (p) => ({ ...p, categories: undefined, page: 1 }),
            })
          }
          onClearAll={() =>
            void navigate({
              to: '.',
              replace: true,
              search: (p) => ({ ...p, active: undefined, categories: undefined, page: 1 }),
            })
          }
        />

        <BrandDataTable<SupplierRow>
          columns={columns}
          gridTemplate={GRID_TEMPLATE}
          state={tableState}
          rowKey={(r) => r.id}
          caption={t('partners.suppliers.list.title')}
          emptyLabel={
            hasFilters ? t('partners.suppliers.list.no-results') : t('partners.suppliers.list.empty')
          }
          loadingLabel={t('partners.suppliers.list.loading')}
          onRowClick={(r) => void navigate({ to: '/parceiros/fornecedores/$id', params: { id: r.id } })}
        />

        <BrandPaginator
          page={pageNum}
          totalPages={pages}
          perPage={search.limit}
          labels={{
            previous: t('partners.suppliers.paginator.previous'),
            next: t('partners.suppliers.paginator.next'),
            page: t('partners.suppliers.paginator.page'),
            of: t('partners.suppliers.paginator.of'),
            perPage: t('partners.suppliers.paginator.perPage'),
          }}
          onPrev={() => void navigate({ to: '.', search: (p) => ({ ...p, page: Math.max(1, pageNum - 1) }) })}
          onNext={() => void navigate({ to: '.', search: (p) => ({ ...p, page: pageNum + 1 }) })}
          onPerPage={(perPage) =>
            void navigate({ to: '.', search: (p) => ({ ...p, limit: perPage, page: 1 }) })
          }
        />
      </div>

      <PartnersPrintable
        title={t('partners.suppliers.list.title')}
        emittedLabel={t('partners.export.count').replace('{n}', String(rows.length))}
        columns={exportColumns}
        rows={exportRows}
        emptyLabel={t('partners.suppliers.list.empty')}
      />
    </div>
  )
}

function toTableState(state: SupplierListState): BrandTableState<SupplierRow> {
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
