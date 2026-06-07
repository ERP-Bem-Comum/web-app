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
import { DownloadIcon, FileTextIcon, FileChartIcon } from '#shared/ui/icons/index.ts'
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
          <DownloadIcon />
          {t('contracts.list.export')}
        </span>
      </summary>

      <div className={menu}>
        <button
          type="button"
          className={menuItem}
          onClick={(e) => { downloadCsv(rows); closeDetails(e) }}
        >
          <FileTextIcon />
          CSV
        </button>
        <button
          type="button"
          className={`${menuItem} ${menuItemBorder}`}
          onClick={(e) => { downloadPdf(); closeDetails(e) }}
        >
          <FileChartIcon />
          PDF
        </button>
      </div>
    </details>
  )
}
