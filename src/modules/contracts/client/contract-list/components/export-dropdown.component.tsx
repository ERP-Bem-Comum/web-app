/**
 * ExportDropdown — dropdown com opções CSV/PDF para exportação da lista.
 * Componente BURRO: o CSV (todos os contratos, legível) é montado/baixado pela ViewModel via `onExportCsv`
 * (recebido por props); o PDF usa `window.print()`. Sem data-hooks, sem montar dados aqui.
 */
import type { ReactNode, MouseEvent } from 'react'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { DownloadIcon, FileTextIcon, FileChartIcon } from '#shared/ui/icons/index.ts'
import { wrapper, trigger, menu, menuItem, menuItemBorder } from './export-dropdown.css.ts'

const t = createTranslator(ptBR)

export interface ExportDropdownProps {
  readonly onExportCsv: () => void
  readonly exporting: boolean
  readonly errorTag: string | null
}

function downloadPdf(): void {
  window.print()
}

function closeDetails(e: MouseEvent<HTMLButtonElement>) {
  const details = e.currentTarget.closest('details')
  if (details) details.open = false
}

export function ExportDropdown({ onExportCsv, exporting, errorTag }: ExportDropdownProps): ReactNode {
  return (
    <details className={wrapper}>
      <summary style={{ listStyle: 'none', cursor: 'pointer' }} aria-label={t('contracts.list.export')}>
        <span className={trigger}>
          <DownloadIcon />
          {t('contracts.list.export')}
        </span>
      </summary>

      <div className={menu}>
        <button
          type="button"
          className={menuItem}
          disabled={exporting}
          aria-disabled={exporting}
          onClick={(e) => {
            onExportCsv()
            closeDetails(e)
          }}
        >
          <FileTextIcon />
          {exporting ? t('contracts.list.exporting') : 'CSV'}
        </button>
        <button
          type="button"
          className={`${menuItem} ${menuItemBorder}`}
          onClick={(e) => {
            downloadPdf()
            closeDetails(e)
          }}
        >
          <FileChartIcon />
          PDF
        </button>
        {errorTag !== null ? (
          <span className={menuItem} role="alert">
            {t(errorTag)}
          </span>
        ) : null}
      </div>
    </details>
  )
}
