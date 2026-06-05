/**
 * ExportDropdown — dropdown com opções PDF/CSV para exportação da lista.
 * Componente BURRO: recebe rows + funções de exportação por props.
 */
import type { ReactNode, MouseEvent } from 'react'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import type { ContractRow } from '#modules/contracts/client/contract-list/contract-list.view-model.ts'
import {
  formatContractNumber,
  formatCurrency,
  formatDate,
  deriveStatus,
  getMostRecentChild,
} from '#modules/contracts/client/contract-list/contract-list.view-model.ts'
import { wrapper, trigger, menu, menuItem, menuItemBorder } from './export-dropdown.css.ts'

const t = createTranslator(ptBR)

export interface ExportDropdownProps {
  readonly rows: readonly ContractRow[]
}

function getContractorName(row: ContractRow): string {
  const c = row.supplier ?? row.financier ?? row.collaborator
  return c?.name ?? c?.corporateName ?? c?.fantasyName ?? '—'
}

function getContractorDoc(row: ContractRow): string {
  const c = row.supplier ?? row.financier ?? row.collaborator
  return c?.cnpj ?? c?.cpf ?? ''
}

function buildCsv(rows: readonly ContractRow[]): string {
  const headers = [
    'Número',
    'Contratado',
    'CNPJ/CPF',
    'Objeto',
    'Tipo',
    'Programa',
    'Valor Atual',
    'Saldo',
    'Início',
    'Fim',
    'Status',
  ]
  const lines = rows.map((row) => {
    const info = getMostRecentChild(row)
    const derived = deriveStatus(info, !!(row.children?.length ?? 0))
    const valorAtual = row.currentValue ?? row.totalValue
    return [
      formatContractNumber(row.contractCode),
      getContractorName(row),
      getContractorDoc(row),
      row.object,
      row.contractType,
      row.program?.name ?? '',
      formatCurrency(valorAtual),
      '—',
      formatDate(row.contractPeriod.start),
      formatDate(row.contractPeriod.end),
      derived.label,
    ]
      .map((cell) => `"${cell.replace(/"/g, '""')}"`)
      .join(';')
  })
  return [headers.join(';'), ...lines].join('\n')
}

function downloadCsv(rows: readonly ContractRow[]): void {
  const csv = buildCsv(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `contratos-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function downloadPdf(): void {
  window.print()
}

function closeDetails(e: MouseEvent<HTMLButtonElement>) {
  const details = e.currentTarget.closest('details')
  if (details) details.open = false
}

export function ExportDropdown({ rows }: ExportDropdownProps): ReactNode {
  return (
    <details className={wrapper}>
      <summary
        style={{ listStyle: 'none', cursor: 'pointer' }}
        aria-label={t('contracts.list.export')}
      >
        <span className={trigger}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {t('contracts.list.export')}
        </span>
      </summary>

      <div className={menu}>
        <button
          type="button"
          className={menuItem}
          onClick={(e) => { downloadCsv(rows); closeDetails(e) }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          CSV
        </button>
        <button
          type="button"
          className={`${menuItem} ${menuItemBorder}`}
          onClick={(e) => { downloadPdf(); closeDetails(e) }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <path d="M9 13h6M9 17h3" />
          </svg>
          PDF
        </button>
      </div>
    </details>
  )
}
