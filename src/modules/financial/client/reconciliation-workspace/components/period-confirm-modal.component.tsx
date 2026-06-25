/**
 * PeriodConfirmModal — view burra: confirma fechar/reabrir período (US7/#203). Menciona o INTERVALO
 * (de DD/MM/AAAA até DD/MM/AAAA) para o usuário saber exatamente o que está fechando/reabrindo. Front puro;
 * a ação real fica nos bindings de close/reopen. `confirm` null → não renderiza.
 */
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import * as s from '../page/reconciliation-workspace.css.ts'

const t = createTranslator(ptBR)
const CLOSE_GLYPH = '✕'

export type PeriodConfirmModalProps = Readonly<{
  confirm: Readonly<{ action: 'close' | 'reopen'; fromBR: string; toBR: string }> | null
  busy: boolean
  onConfirm: () => void
  onCancel: () => void
}>

export function PeriodConfirmModal({ confirm, busy, onConfirm, onCancel }: PeriodConfirmModalProps) {
  if (confirm === null) return null
  const isClose = confirm.action === 'close'
  const titleTag = isClose
    ? 'financial.recon.period.confirm.titleClose'
    : 'financial.recon.period.confirm.titleReopen'
  const questionTag = isClose
    ? 'financial.recon.period.confirm.qClose'
    : 'financial.recon.period.confirm.qReopen'
  return (
    <div
      className={s.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-label={t(titleTag)}
      onClick={onCancel}
    >
      <div
        className={s.modalDialog}
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <header className={s.modalHead}>
          <h3 className={s.modalTitle}>{t(titleTag)}</h3>
          <button
            type="button"
            className={s.modalClose}
            aria-label={t('financial.recon.switch.close')}
            onClick={onCancel}
          >
            {CLOSE_GLYPH}
          </button>
        </header>

        <div className={s.modalMessage}>
          <p>
            {t(questionTag)} <strong className={s.modalMessageStrong}>{confirm.fromBR}</strong>{' '}
            {t('financial.recon.period.confirm.until')}{' '}
            <strong className={s.modalMessageStrong}>{confirm.toBR}</strong>?
          </p>
        </div>

        <div className={s.modalFooter}>
          <button type="button" className={s.btnSecondary} onClick={onCancel}>
            {t('financial.recon.period.confirm.cancel')}
          </button>
          <button type="button" className={s.modalBtnPrimary} disabled={busy} onClick={onConfirm}>
            {t(
              isClose ? 'financial.recon.period.confirm.okClose' : 'financial.recon.period.confirm.okReopen',
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
