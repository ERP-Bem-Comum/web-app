/**
 * CollaboratorExportDropdown — dropdown de export de Colaboradores conforme o print do legado:
 * **Tudo** e **Histórico** geram PDF (via `onPrint` → `window.print` do printable na página) e
 * **Baixar template** baixa um CSV com os cabeçalhos de importação (modelo p/ reimportar).
 */
import type { ReactNode, MouseEvent } from 'react'

import { FileChartIcon, FileTextIcon } from '#shared/ui/icons/index.ts'
import { buildCsv, COLLABORATOR_IMPORT_HEADERS } from '#modules/partners/client/domain/export-csv.ts'

import { wrapper, trigger, menu, menuItem, menuItemBorder, menuItemDisabled, menuItemHint } from './export-dropdown.css.ts'

export type CollaboratorExportDropdownProps = Readonly<{
  exportLabel: string
  tudoLabel: string
  historicoLabel: string
  /** Aviso do "Histórico" gated — pendente do backend (ver ticket PAR-COLLABORATOR-HISTORY-EXPORT). */
  historicoGatedHint: string
  templateLabel: string
  onPrint: () => void
}>

function downloadTemplate(): void {
  const csv = buildCsv(COLLABORATOR_IMPORT_HEADERS, [])
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'colaboradores-template.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function closeDetails(e: MouseEvent<HTMLButtonElement>): void {
  const details = e.currentTarget.closest('details')
  if (details) details.open = false
}

export function CollaboratorExportDropdown(props: CollaboratorExportDropdownProps): ReactNode {
  return (
    <details className={wrapper}>
      <summary style={{ listStyle: 'none' }} className={trigger} aria-label={props.exportLabel}>
        {props.exportLabel}
      </summary>
      <div className={menu}>
        <button type="button" className={menuItem} onClick={(e) => { props.onPrint(); closeDetails(e) }}>
          <FileChartIcon />
          {props.tudoLabel}
        </button>
        {/* Histórico gated: no legado gerava CSV de histórico (tabela collaborator_history); o core-api
            ainda não expõe esse dado (ticket PAR-COLLABORATOR-HISTORY-EXPORT). Desabilitado até liberar. */}
        <button type="button" className={`${menuItem} ${menuItemBorder} ${menuItemDisabled}`} disabled aria-disabled="true">
          <FileChartIcon />
          {props.historicoLabel}
        </button>
        <span className={menuItemHint}>{props.historicoGatedHint}</span>
        <button type="button" className={`${menuItem} ${menuItemBorder}`} onClick={(e) => { downloadTemplate(); closeDetails(e) }}>
          <FileTextIcon />
          {props.templateLabel}
        </button>
      </div>
    </details>
  )
}
