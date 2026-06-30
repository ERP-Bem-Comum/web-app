/**
 * ExportMenu — view burra: botão "Exportar conciliação" + dropdown (OFX/CSV/PDF), fiel ao mock (espelha o
 * Importar, abre p/ cima no footer). OFX/CSV ligados ao #173 (exporta o período mais recente da conta, com
 * o range no topo do menu); PDF segue chrome (#145). Recebe o estado de abrir/fechar (`menus`) e a ação de
 * export (`exportBinding`) por props; sem data-hooks.
 */
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { ChevronDownIcon, DownloadIcon } from '#shared/ui/icons/index.ts'

import * as s from '../page/reconciliation-workspace.css.ts'
import type { HeaderMenusBinding } from '../header-menus.binding.ts'
import type { ExportBinding } from '../export-conciliacao.binding.ts'
import type { ExportFormat } from '../reconciliation-workspace.view-model.ts'

const t = createTranslator(ptBR)

const ITEMS: readonly { ic: string; lblTag: string; hintTag?: string; format: ExportFormat | null }[] = [
  {
    ic: 'OFX',
    lblTag: 'financial.recon.export.ofx',
    hintTag: 'financial.recon.export.ofxHint',
    format: 'ofx',
  },
  {
    ic: 'CSV',
    lblTag: 'financial.recon.export.csv',
    hintTag: 'financial.recon.export.csvHint',
    format: 'csv-nibo',
  },
  // PDF segue chrome até #145 (sem endpoint).
  {
    ic: 'PDF',
    lblTag: 'financial.recon.export.pdf',
    hintTag: 'financial.recon.export.pdfHint',
    format: null,
  },
]

export type ExportMenuProps = Readonly<{ menus: HeaderMenusBinding; exportBinding: ExportBinding }>

export function ExportMenu({ menus, exportBinding }: ExportMenuProps) {
  const { canExport, periodLabel, exporting, errorTag } = exportBinding
  return (
    <div className={s.ddWrap}>
      <button
        type="button"
        className={s.btnSecondary}
        aria-haspopup="menu"
        aria-expanded={menus.exportOpen}
        onClick={menus.toggleExport}
      >
        <DownloadIcon />
        {t('financial.recon.bottombar.export')}
        <ChevronDownIcon />
      </button>

      {menus.exportOpen ? (
        <>
          <button
            type="button"
            className={s.ddBackdrop}
            aria-label={t('financial.recon.bottombar.export')}
            onClick={menus.closeAll}
          />
          <div className={s.exportMenu} role="menu">
            <div className={s.ddGroup}>{t('financial.recon.export.group')}</div>
            {canExport && periodLabel !== null ? (
              <div className={s.ddGroup}>{`${t('financial.recon.export.periodLabel')}: ${periodLabel}`}</div>
            ) : (
              <div className={s.ddGroup}>{t('financial.recon.export.noPeriod')}</div>
            )}
            {ITEMS.map((it) => {
              const isPdf = it.format === null
              const disabled = isPdf || !canExport || exporting
              const title = isPdf
                ? t('financial.recon.export.pdfUnavailable')
                : !canExport
                  ? t('financial.recon.export.noPeriod')
                  : undefined
              return (
                <button
                  key={it.ic}
                  type="button"
                  role="menuitem"
                  className={disabled ? s.ddItem.off : s.ddItem.on}
                  disabled={disabled}
                  aria-disabled={disabled}
                  title={title}
                  onClick={() => {
                    if (it.format !== null) exportBinding.exportAs(it.format)
                  }}
                >
                  <span className={s.ddItemIc} aria-hidden>
                    {it.ic}
                  </span>
                  <span className={s.ddItemLbl}>{t(it.lblTag)}</span>
                  {it.hintTag !== undefined ? <span className={s.ddItemHint}>{t(it.hintTag)}</span> : null}
                </button>
              )
            })}
            {errorTag !== null ? <div className={s.ddGroup}>{t(errorTag)}</div> : null}
          </div>
        </>
      ) : null}
    </div>
  )
}
