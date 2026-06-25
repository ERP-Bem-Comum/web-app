/**
 * Reconciled-banner (US5) — view burra: mostrada quando a movimentação selecionada já está conciliada.
 * Permite desfazer (motivo opcional). Limitação honesta: o Desfazer só fica habilitado para conciliações
 * feitas nesta sessão (o backend não expõe o id na listagem — #152); senão fica anunciado/desabilitado.
 */
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { CheckCircleIcon } from '#shared/ui/icons/index.ts'

import * as s from '../page/reconciliation-workspace.css.ts'
import type { UndoBinding } from '../undo.binding.ts'

const t = createTranslator(ptBR)

export type ReconciledBannerProps = Readonly<{
  undo: UndoBinding
  reconciliationId: string | null
  transactionId: string
}>

export function ReconciledBanner({ undo, reconciliationId, transactionId }: ReconciledBannerProps) {
  const canUndo = reconciliationId !== null
  return (
    <div className={s.assocCol}>
      <div className={s.banner}>
        <span className={s.bannerTitle}>
          <CheckCircleIcon />
          {t('financial.recon.undo.banner')}
        </span>
        <div className={s.undoRow}>
          <div className={s.undoField}>
            <label className={s.fieldLabel} htmlFor="recon-undo-reason">
              {t('financial.recon.undo.reason')}
            </label>
            <input
              id="recon-undo-reason"
              className={s.input}
              value={undo.reason}
              onChange={(e) => {
                undo.setReason(e.target.value)
              }}
            />
          </div>
          <button
            type="button"
            className={s.btnSecondary}
            disabled={!canUndo || undo.undoing}
            aria-disabled={!canUndo}
            onClick={() => {
              if (reconciliationId !== null) undo.undo(reconciliationId, transactionId)
            }}
          >
            {t('financial.recon.undo.button')}
          </button>
        </div>
        {!canUndo ? <p className={s.summaryLbl}>{t('financial.recon.undo.unavailable')}</p> : null}
        {undo.errorTag !== null ? <p className={s.errorText}>{t(undo.errorTag)}</p> : null}
      </div>
    </div>
  )
}
