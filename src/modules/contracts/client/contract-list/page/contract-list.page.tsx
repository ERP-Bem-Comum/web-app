/**
 * ContractListPage — Tela 1: Listagem de Contratos (replicação v1).
 * Layout: header (filtro + busca + chips), filtros condicionais, tabela, bottombar fixo.
 */
import type { ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { isOk } from '#shared/primitives/result.ts'
import { formatContractNumber } from '#modules/contracts/client/domain/format.ts'
import { useContractListController } from '../contract-list.controller.ts'
import { useContractListBinding } from '../contract-list.binding.ts'
import { useContractsCsvExport } from '../contracts-csv-export.binding.ts'
import { useCancelContractBinding } from '../../contract-terminate/cancel-contract.binding.ts'
import {
  mapListResponseToContractRows,
  parseDateParam,
  filterExpiringRows,
  buildContractDocData,
  buildContractHistoricoData,
  formatEmittedDate,
} from '../contract-list.view-model.ts'
import { useContractHistoricoPayments } from '../contract-payments.binding.ts'
import { ContractStatusChips } from '../components/contract-status-chips.component.tsx'
import { ContractFilters } from '../components/contract-filters.component.tsx'
import { ContractsTable } from '../components/contracts-table.component.tsx'
import { ContractRow } from '../components/contract-row.component.tsx'
import { ContractPaginator } from '../components/contract-paginator.component.tsx'
import { ExportDropdown } from '../components/export-dropdown.component.tsx'
import { DeleteContractModal } from '../components/delete-contract-modal.component.tsx'
import {
  PrintableDocument,
  type PrintableDocKind,
  type PrintableDocData,
} from '../components/printable-document.component.tsx'
import type { ContractListFilters, ContractRow as ContractRowData } from '../contract-list.view-model.ts'
import { FilterIcon, SearchIcon } from '#shared/ui/icons/index.ts'

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
  contentWrap,
  contentWrapPrintHidden,
} from './contract-list.css.ts'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/contratos/')

export function ContractListPage(): ReactNode {
  const search = routeApi.useSearch()
  const navigate = useNavigate()
  const { showFilters, toggleFilters, nowMs } = useContractListController()
  const [deleteTarget, setDeleteTarget] = useState<ContractRowData | null>(null)
  const { cancelCommand } = useCancelContractBinding()
  const [printDoc, setPrintDoc] = useState<{
    kind: PrintableDocKind
    data: PrintableDocData
    emittedAt: string
  } | null>(null)
  // Histórico de Pagamento é ASSÍNCRONO (busca os pagamentos conciliados do contrato antes de imprimir).
  const [historicoTarget, setHistoricoTarget] = useState<ContractRowData | null>(null)
  const historicoPayments = useContractHistoricoPayments(
    historicoTarget !== null ? String(historicoTarget.id) : null,
    historicoTarget?.supplierId ?? undefined,
  )

  // Cancelamento (§1.7): o modal SOME ao concluir (derivação server-state→"concluído" vive no binding,
  // `succeeded`, A1 — sem setState no efeito). A lista é invalidada no binding. O gatilho reseta o
  // command ao abrir (p/ não reaproveitar um `succeeded` anterior).
  const cancelModalOpen = deleteTarget !== null && !cancelCommand.succeeded

  // Dispara a impressão (→ "Salvar como PDF") quando um documento é selecionado; limpa ao concluir.
  // `window.print()` é o mesmo mecanismo do Exportar→PDF (sem dependência de lib).
  useEffect(() => {
    if (printDoc === null) return
    const id = window.setTimeout(() => {
      window.print()
      setPrintDoc(null)
    }, 80)
    return () => {
      window.clearTimeout(id)
    }
  }, [printDoc])

  // Quando os pagamentos do contrato-alvo assentam, monta o Histórico e imprime (depois limpa o alvo).
  // setState DIFERIDO (mesmo padrão do efeito de impressão) p/ não disparar render em cascata no efeito.
  useEffect(() => {
    if (historicoTarget === null || !historicoPayments.ready) return
    const data = buildContractHistoricoData(historicoTarget, historicoPayments.payments)
    const emittedAt = formatEmittedDate(nowMs)
    const id = window.setTimeout(() => {
      setPrintDoc({ kind: 'historico', data, emittedAt })
      setHistoricoTarget(null)
    }, 0)
    return () => {
      window.clearTimeout(id)
    }
  }, [historicoTarget, historicoPayments.ready, historicoPayments.payments, nowMs])

  const handleGenerateDoc = (row: ContractRowData, kind: PrintableDocKind): void => {
    // Data de emissão derivada do `nowMs` (controller) — sem relógio no render (C1/§XI).
    if (kind === 'historico') {
      // Assíncrono: dispara a busca dos pagamentos conciliados; o efeito acima imprime quando assenta.
      setHistoricoTarget(row)
      return
    }
    setPrintDoc({ kind, data: buildContractDocData(row), emittedAt: formatEmittedDate(nowMs) })
  }

  const { data, isLoading } = useContractListBinding({
    page: search.page,
    limit: search.limit,
    order: search.order,
    search: search.search,
    contractType: search.contractType as 'Supplier' | 'Financier' | 'Collaborator' | 'ACT' | undefined,
    status: search.contractStatus as
      | 'Pendente'
      | 'Em Andamento'
      | 'Finalizado'
      | 'Distrato'
      | 'Cancelado'
      | undefined,
    contractPeriodStart: parseDateParam(search.contractPeriodStart),
    contractPeriodEnd: parseDateParam(search.contractPeriodEnd),
    minValue: search.minValue,
    maxValue: search.maxValue,
    budgetPlanId: search.budgetPlanId ?? undefined,
  })

  // Export CSV "todos os contratos" (legível): pagina toda a lista dos filtros ativos e monta o arquivo.
  const csvExport = useContractsCsvExport({
    order: search.order,
    search: search.search,
    contractType: search.contractType as 'Supplier' | 'Financier' | 'Collaborator' | 'ACT' | undefined,
    status: search.contractStatus as
      | 'Pendente'
      | 'Em Andamento'
      | 'Finalizado'
      | 'Distrato'
      | 'Cancelado'
      | undefined,
    contractPeriodStart: parseDateParam(search.contractPeriodStart),
    contractPeriodEnd: parseDateParam(search.contractPeriodEnd),
    minValue: search.minValue,
    maxValue: search.maxValue,
    budgetPlanId: search.budgetPlanId ?? undefined,
  })

  const allRows = data && isOk(data) ? mapListResponseToContractRows(data.value) : []

  const domainToSlug = (d: string | undefined): string => {
    const map: Record<string, string> = {
      'Em Andamento': 'em-andamento',
      Pendente: 'pendente',
      Finalizado: 'finalizado',
      Distrato: 'distrato',
      Cancelado: 'cancelado',
    }
    return d ? (map[d] ?? d) : 'todos'
  }

  const slugToDomain = (s: string): string | undefined => {
    const map: Record<string, string> = {
      'em-andamento': 'Em Andamento',
      pendente: 'Pendente',
      finalizado: 'Finalizado',
      distrato: 'Distrato',
      cancelado: 'Cancelado',
    }
    return s === 'todos' ? undefined : map[s]
  }

  const selectedSlug = search.vencendo ? 'vencendo' : domainToSlug(search.contractStatus)

  const rows = selectedSlug === 'vencendo' ? filterExpiringRows(allRows, nowMs) : allRows

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

  const meta =
    selectedSlug === 'vencendo'
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
      <div className={printDoc !== null ? contentWrapPrintHidden : contentWrap}>
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

          <ExportDropdown
            onExportCsv={csvExport.exportCsv}
            exporting={csvExport.exporting}
            errorTag={csvExport.errorTag}
          />
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
                <ContractRow
                  key={row.id}
                  row={row}
                  index={index}
                  onRequestDelete={(r) => {
                    cancelCommand.reset()
                    setDeleteTarget(r)
                  }}
                  onGenerateDoc={handleGenerateDoc}
                />
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
              onItemsPerPageChange={
                selectedSlug === 'vencendo'
                  ? undefined
                  : (limit) => {
                      void navigate({
                        to: '/contratos',
                        search: {
                          ...search,
                          limit,
                          page: 1,
                        },
                      })
                    }
              }
            />
          )}
          <Link to="/contratos/criar" className={newButton}>
            + {t('contracts.list.new')}
          </Link>
        </div>
      </div>

      {printDoc !== null ? (
        <PrintableDocument kind={printDoc.kind} data={printDoc.data} emittedAt={printDoc.emittedAt} />
      ) : null}

      <DeleteContractModal
        open={cancelModalOpen}
        contractLabel={
          deleteTarget ? formatContractNumber(deleteTarget.contractCode, deleteTarget.classification) : ''
        }
        onClose={() => {
          setDeleteTarget(null)
          cancelCommand.reset()
        }}
        onConfirm={() => {
          if (deleteTarget !== null) cancelCommand.execute({ contractId: deleteTarget.id })
        }}
        running={cancelCommand.running}
        errorTag={cancelCommand.errorTag}
      />
    </div>
  )
}
