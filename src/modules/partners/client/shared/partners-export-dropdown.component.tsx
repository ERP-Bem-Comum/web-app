/**
 * PartnersExportDropdown — dropdown de exportação no padrão dos Contratos (CSV + PDF). Componente BURRO:
 * recebe os dados do CSV por props; o CSV é gerado/baixado client-side, o PDF dispara `onPrint` (a página
 * orquestra `window.print` com o printable). Usado por Fornecedores/Financiadores/ACT.
 */
import type { ReactNode, MouseEvent } from 'react'

import { FileTextIcon, FileChartIcon } from '#shared/ui/icons/index.ts'
import { buildCsv, csvFileStamp } from '#modules/partners/client/domain/export-csv.ts'

import { wrapper, trigger, menu, menuItem, menuItemBorder } from './export-dropdown.css.ts'

export type PartnersExportDropdownProps = Readonly<{
  exportLabel: string
  filenameBase: string
  headers: readonly string[]
  rows: readonly (readonly string[])[]
  onPrint: () => void
}>

function downloadCsv(filenameBase: string, headers: readonly string[], rows: readonly (readonly string[])[]): void {
  const csv = buildCsv(headers, rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filenameBase}-${csvFileStamp()}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function closeDetails(e: MouseEvent<HTMLButtonElement>): void {
  const details = e.currentTarget.closest('details')
  if (details) details.open = false
}

export function PartnersExportDropdown(props: PartnersExportDropdownProps): ReactNode {
  return (
    <details className={wrapper}>
      <summary style={{ listStyle: 'none' }} className={trigger} aria-label={props.exportLabel}>
        {props.exportLabel}
      </summary>
      <div className={menu}>
        <button
          type="button"
          className={menuItem}
          onClick={(e) => { downloadCsv(props.filenameBase, props.headers, props.rows); closeDetails(e) }}
        >
          <FileTextIcon />
          CSV
        </button>
        <button
          type="button"
          className={`${menuItem} ${menuItemBorder}`}
          onClick={(e) => { props.onPrint(); closeDetails(e) }}
        >
          <FileChartIcon />
          PDF
        </button>
      </div>
    </details>
  )
}
