/**
 * PeriodActionsMenu — view burra: botão "Período" no footer que abre as ações Fechar/Abrir período (espelha
 * o ExportMenu, abre p/ cima). "Fechar período" usa o gating do binding (sem extrato/pendências → off, com
 * tooltip). "Abrir período" (reabertura, contábil) é CHROME honesto — desabilitado até o backend expor a
 * rota de reopen (core-api#203). Recebe o estado de abrir/fechar (`menus`) e a ação de fechar por props.
 */
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { CalendarCheckIcon, ChevronDownIcon } from '#shared/ui/icons/index.ts'

import * as s from '../page/reconciliation-workspace.css.ts'
import type { HeaderMenusBinding } from '../header-menus.binding.ts'

const t = createTranslator(ptBR)

export type PeriodActionsMenuProps = Readonly<{
  menus: HeaderMenusBinding
  canClose: boolean
  /** Tooltip quando Fechar está bloqueado (sem extrato / há pendências); null quando habilitado. */
  closeHint: string | null
  onClosePeriod: () => void
}>

export function PeriodActionsMenu({ menus, canClose, closeHint, onClosePeriod }: PeriodActionsMenuProps) {
  return (
    <div className={s.ddWrap}>
      <button
        type="button"
        className={s.btnPrimary}
        aria-haspopup="menu"
        aria-expanded={menus.periodActionsOpen}
        onClick={menus.togglePeriodActions}
      >
        <CalendarCheckIcon />
        {t('financial.recon.bottombar.periodActions')}
        <ChevronDownIcon />
      </button>

      {menus.periodActionsOpen ? (
        <>
          <button
            type="button"
            className={s.ddBackdrop}
            aria-label={t('financial.recon.bottombar.periodActions')}
            onClick={menus.closeAll}
          />
          <div className={s.exportMenu} role="menu">
            <div className={s.ddGroup}>{t('financial.recon.period.actionsGroup')}</div>

            {/* Fechar período — funcional (gated) */}
            <button
              type="button"
              role="menuitem"
              className={canClose ? s.ddItem.on : s.ddItem.off}
              disabled={!canClose}
              aria-disabled={!canClose}
              title={closeHint ?? undefined}
              onClick={() => {
                onClosePeriod()
                menus.closeAll()
              }}
            >
              <span className={s.ddItemLbl}>{t('financial.recon.bottombar.close')}</span>
            </button>

            {/* Abrir período (reabertura) — chrome honesto até o backend (core-api#203) */}
            <button
              type="button"
              role="menuitem"
              className={s.ddItem.off}
              disabled
              aria-disabled="true"
              title={t('financial.recon.close.reopenUnavailable')}
            >
              <span className={s.ddItemLbl}>{t('financial.recon.close.reopen')}</span>
              <span className={s.ddItemHint}>{t('financial.recon.close.soon')}</span>
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}
