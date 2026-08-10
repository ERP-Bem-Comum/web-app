/**
 * ReportExportDropdown — dropdown Exportar (CSV/PDF) do relatório. View BURRA: o CSV é montado pela ViewModel
 * e baixado via callback (`onExportCsv`, recebido por props); o PDF usa `window.print()` (padrão Contratos).
 * Sem data-hooks, sem montar dados aqui. O trigger reusa o estilo `exportTrigger` do kit brand.
 */
import type { ReactNode, MouseEvent } from 'react'

import { DownloadIcon, FileTextIcon, FileChartIcon } from '#shared/ui/index.ts'

import { wrapper, menu, menuItem, menuItemBorder } from './report-export-dropdown.css.ts'

export type ReportExportDropdownProps = Readonly<{
  triggerClassName: string
  exportLabel: string
  csvLabel: string
  pdfLabel: string
  onExportCsv: () => void
}>

function closeDetails(e: MouseEvent<HTMLButtonElement>): void {
  const details = e.currentTarget.closest('details')
  if (details) details.open = false
}

export function ReportExportDropdown(props: ReportExportDropdownProps): ReactNode {
  return (
    <details className={wrapper}>
      <summary style={{ listStyle: 'none', cursor: 'pointer' }} aria-label={props.exportLabel}>
        <span className={props.triggerClassName}>
          <DownloadIcon size={16} />
          {props.exportLabel}
        </span>
      </summary>

      <div className={menu}>
        <button
          type="button"
          className={menuItem}
          onClick={(e) => {
            props.onExportCsv()
            closeDetails(e)
          }}
        >
          <FileTextIcon size={16} />
          {props.csvLabel}
        </button>
        <button
          type="button"
          className={`${menuItem} ${menuItemBorder}`}
          onClick={(e) => {
            window.print()
            closeDetails(e)
          }}
        >
          <FileChartIcon size={16} />
          {props.pdfLabel}
        </button>
      </div>
    </details>
  )
}
