/**
 * ContractListPage — Tela 1: Listagem de Contratos (replicação v1).
 * Layout: header (filtro + busca + chips), filtros condicionais, tabela, bottombar fixo.
 */
import type { ReactNode } from 'react'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { isOk } from '#shared/primitives/result.ts'
import { useContractListController } from '../contract-list.controller.ts'
import { useContractListBinding } from '../contract-list.binding.ts'
import { mapListResponseToContractRows } from '../contract-list.view-model.ts'
import { ContractStatusChips } from '../components/contract-status-chips.component.tsx'
import { ContractFilters } from '../components/contract-filters.component.tsx'
import { ContractsTable } from '../components/contracts-table.component.tsx'
import { ContractRow } from '../components/contract-row.component.tsx'
import { ContractPaginator } from '../components/contract-paginator.component.tsx'
import { ExportDropdown } from '../components/export-dropdown.component.tsx'
import type { ContractListFilters } from '../contract-list.view-model.ts'

import {
  screen,
  header,
  filterToggle,
  filterToggleActive,
  searchWrap,
  searchIcon,
  searchInput,
  chipsWrap,
  filtersArea,
  tableWrap,
  bottombar,
  newButton,
} from './contract-list.css.ts'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/contratos/')

/* ─── Ícones inline (replicação v1) ─── */

function FilterIcon(): ReactNode {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}

function SearchIcon(): ReactNode {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

export function ContractListPage(): ReactNode {
  const search = routeApi.useSearch()
  const navigate = useNavigate()
  const { showFilters, toggleFilters } = useContractListController()

  const { data, isLoading } = useContractListBinding({
    page: search.page,
    limit: search.limit,
    order: search.order,
    search: search.search,
    contractType: search.contractType as 'Supplier' | 'Financier' | 'Collaborator' | 'ACT' | undefined,
    status: search.contractStatus as 'Pendente' | 'Em Andamento' | 'Finalizado' | 'Distrato' | undefined,
    contractPeriodStart: search.contractPeriodStart
      ? new Date(search.contractPeriodStart)
      : undefined,
    contractPeriodEnd: search.contractPeriodEnd
      ? new Date(search.contractPeriodEnd)
      : undefined,
    minValue: search.minValue,
    maxValue: search.maxValue,
    budgetPlanId: search.budgetPlanId
      ? Number(search.budgetPlanId)
      : undefined,
  })

  const allRows = data && isOk(data) ? mapListResponseToContractRows(data.value) : []

  const domainToSlug = (d: string | undefined): string => {
    const map: Record<string, string> = {
      'Em Andamento': 'em-andamento',
      Pendente: 'pendente',
      Finalizado: 'finalizado',
      Distrato: 'distrato',
    }
    return d ? (map[d] ?? d) : 'todos'
  }

  const slugToDomain = (s: string): string | undefined => {
    const map: Record<string, string> = {
      'em-andamento': 'Em Andamento',
      pendente: 'Pendente',
      finalizado: 'Finalizado',
      distrato: 'Distrato',
    }
    return s === 'todos' ? undefined : map[s]
  }

  const selectedSlug = search.vencendo ? 'vencendo' : domainToSlug(search.contractStatus)

  const rows = ((): typeof allRows => {
    if (selectedSlug !== 'vencendo') return allRows
    const now = new Date().getTime()
    const msPerDay = 1000 * 60 * 60 * 24
    const thresholdDays = 45
    return allRows.filter((row) => {
      const daysUntilEnd = (new Date(row.contractPeriod.end).getTime() - now) / msPerDay
      return daysUntilEnd >= 0 && daysUntilEnd <= thresholdDays
    })
  })()

  const handleFilterChange = (filters: ContractListFilters): void => {
    void navigate({
      to: '/contratos',
      search: {
        ...search,
        ...filters,
        page: 1,
      },
    })
  }

  const handlePageChange = (page: number): void => {
    void navigate({
      to: '/contratos',
      search: {
        ...search,
        page,
      },
    })
  }

  const apiMeta = data && isOk(data) ? data.value.meta : null

  const meta = selectedSlug === 'vencendo'
    ? {
        page: 1,
        totalPages: 1,
        totalItems: rows.length,
      }
    : apiMeta
      ? {
          page: apiMeta.page,
          totalPages: apiMeta.totalPages,
          totalItems: apiMeta.total,
        }
      : null

  return (
    <div className={screen}>
      {/* Header */}
      <div className={header}>
        <button
          type="button"
          className={showFilters ? filterToggleActive : filterToggle}
          onClick={toggleFilters}
          aria-pressed={showFilters}
          aria-label="Filtros"
          title="Mostrar/ocultar filtros"
        >
          <FilterIcon />
        </button>

        <div className={searchWrap}>
          <span className={searchIcon} aria-hidden="true">
            <SearchIcon />
          </span>
          <input
            id="contract-search"
            type="text"
            className={searchInput}
            placeholder="Buscar por contratado, número, CNPJ/CPF"
            value={search.search ?? ''}
            onChange={(e) => {
              void navigate({
                to: '/contratos',
                search: { ...search, search: e.target.value || undefined, page: 1 },
              })
            }}
          />
        </div>

        <div className={chipsWrap}>
          <ContractStatusChips
            contracts={allRows}
            selected={selectedSlug}
            onChange={(slug) => {
              const isVencendo = slug === 'vencendo'
              void navigate({
                to: '/contratos',
                search: {
                  ...search,
                  vencendo: isVencendo || undefined,
                  contractStatus: isVencendo ? undefined : slugToDomain(slug),
                  page: 1,
                },
              })
            }}
          />
        </div>

        <ExportDropdown rows={rows} />
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className={filtersArea}>
          <ContractFilters filters={search} onChange={handleFilterChange} />
        </div>
      )}

      {/* Tabela */}
      <div className={tableWrap}>
        {isLoading ? (
          <div>{t('common.loading')}</div>
        ) : (
          <ContractsTable
            rows={rows}
            renderRow={(row, index) => (
              <ContractRow key={row.id} row={row} index={index} />
            )}
          />
        )}
      </div>

      {/* Bottombar fixo (v1) */}
      <div className={bottombar}>
        {meta && (
          <ContractPaginator
            page={meta.page}
            totalPages={meta.totalPages}
            totalItems={meta.totalItems}
            itemsPerPage={search.limit}
            onPageChange={handlePageChange}
            onItemsPerPageChange={selectedSlug === 'vencendo' ? undefined : (limit) => {
              void navigate({
                to: '/contratos',
                search: {
                  ...search,
                  limit,
                  page: 1,
                },
              })
            }}
          />
        )}
        <Link to="/contratos/criar" className={newButton}>
          + {t('contracts.list.new')}
        </Link>
      </div>
    </div>
  )
}
