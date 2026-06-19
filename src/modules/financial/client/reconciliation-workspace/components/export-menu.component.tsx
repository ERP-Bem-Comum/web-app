/**
 * ExportMenu — view burra: botão "Exportar conciliação" + dropdown (OFX/CSV/PDF), fiel ao mock (espelha o
 * Importar, abre p/ cima no footer). CHROME honesto até #173 (sem endpoint p/ obter o periodId) — os itens
 * ficam desabilitados/anunciados. Recebe o binding por props; sem data-hooks.
 */
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { ChevronDownIcon, DownloadIcon } from '#shared/ui/icons/index.ts'

import * as s from '../page/reconciliation-workspace.css.ts'
import type { HeaderMenusBinding } from '../header-menus.binding.ts'

const t = createTranslator(ptBR)

const ITEMS: readonly { ic: string; lblTag: string; hintTag?: string }[] = [
  { ic: 'OFX', lblTag: 'financial.recon.export.ofx', hintTag: 'financial.recon.export.ofxHint' },
  { ic: 'CSV', lblTag: 'financial.recon.export.csv' },
  { ic: 'PDF', lblTag: 'financial.recon.export.pdf', hintTag: 'financial.recon.export.pdfHint' },
]

export type ExportMenuProps = Readonly<{ menus: HeaderMenusBinding }>

export function ExportMenu({ menus }: ExportMenuProps) {
  return (
    <div className={s.ddWrap}>
      <button
        type="button"
        className={s.btnSecondary}
        aria-haspopup="menu"
        aria-expanded={menus.exportOpen}
        title={t('financial.recon.bottombar.exportUnavailable')}
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
            {ITEMS.map((it) => (
              <button
                key={it.ic}
                type="button"
                role="menuitem"
                className={s.ddItem.off}
                disabled
                aria-disabled="true"
                title={t('financial.recon.bottombar.exportUnavailable')}
              >
                <span className={s.ddItemIc} aria-hidden>
                  {it.ic}
                </span>
                <span className={s.ddItemLbl}>{t(it.lblTag)}</span>
                {it.hintTag !== undefined ? <span className={s.ddItemHint}>{t(it.hintTag)}</span> : null}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
