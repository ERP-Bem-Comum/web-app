/**
 * ExportDropdown (Contas a Pagar) — view BURRA (§XI): CSV (blob client-side) + PDF (window.print).
 * Espelha o do grid de Contratos; client-side (sem backend). Recebe as linhas exibidas por prop.
 */
import type { ReactNode, MouseEvent } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { DownloadIcon, FileTextIcon, FileChartIcon } from '#shared/ui/icons/index.ts'

import { buildDocumentsCsv, exportFileStamp, type GridRow } from '../contas-a-pagar.view-model.ts'
import {
  wrapper,
  trigger,
  menu,
  menuItem,
  menuItemBorder,
  menuItemDisabled,
  itemCol,
  itemHint,
} from './export-dropdown.css.ts'

const t = createTranslator(ptBR)

export type ExportDropdownProps = Readonly<{
  rows: readonly GridRow[]
  /** VAN (core-api#728): abre a conferência da remessa. Leitura pura — não gera arquivo nem paga nada. */
  onCheckRemittance: () => void
  /** Sem título APROVADO entre as linhas, não há remessa a conferir (premissa: só aprovado entra). */
  remittanceDisabled: boolean
}>

const downloadCsv = (rows: readonly GridRow[]): void => {
  const blob = new Blob([buildDocumentsCsv(rows)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `contas-a-pagar-${exportFileStamp()}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const closeDetails = (e: MouseEvent<HTMLButtonElement>): void => {
  const details = e.currentTarget.closest('details')
  if (details) details.open = false
}

export function ExportDropdown({
  rows,
  onCheckRemittance,
  remittanceDisabled,
}: ExportDropdownProps): ReactNode {
  return (
    <details className={wrapper}>
      <summary style={{ listStyle: 'none', cursor: 'pointer' }} aria-label={t('financial.list.export')}>
        <span className={trigger}>
          <DownloadIcon />
          {t('financial.list.export')}
        </span>
      </summary>

      <div className={menu}>
        <button
          type="button"
          className={menuItem}
          onClick={(e) => {
            downloadCsv(rows)
            closeDetails(e)
          }}
        >
          <FileTextIcon />
          CSV
        </button>
        <button
          type="button"
          className={`${menuItem} ${menuItemBorder}`}
          onClick={(e) => {
            window.print()
            closeDetails(e)
          }}
        >
          <FileChartIcon />
          PDF
        </button>
        {/* CNAB → conferência da remessa da VAN (core-api#728). Diferente do CSV/PDF acima, que baixam
            arquivo na hora: aqui NADA é baixado nem enviado — abre o pré-voo (leitura pura). A geração,
            que enfileira pagamento no banco, é outra fatia e terá cerimônia própria. */}
        <button
          type="button"
          className={`${menuItem} ${menuItemBorder}${remittanceDisabled ? ` ${menuItemDisabled}` : ''}`}
          disabled={remittanceDisabled}
          title={remittanceDisabled ? t('financial.list.export.cnabNeedApproved') : undefined}
          onClick={(e) => {
            onCheckRemittance()
            closeDetails(e)
          }}
        >
          <FileChartIcon />
          <span className={itemCol}>
            {t('financial.list.export.cnab')}
            <span className={itemHint}>{t('financial.list.export.cnabHint')}</span>
          </span>
        </button>
      </div>
    </details>
  )
}
