/**
 * DeleteStatementModal — view burra: confirma a exclusão do extrato importado (core-api#558). Ação
 * DESTRUTIVA: as transações não conciliadas são removidas (hard-delete). Front puro; a exclusão real fica no
 * `delete-statement.binding.ts`. `open` false → não renderiza. Mostra o erro (guarda 409) dentro do modal.
 */
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import * as s from '../page/reconciliation-workspace.css.ts'

const t = createTranslator(ptBR)
const CLOSE_GLYPH = '✕'

export type DeleteStatementModalProps = Readonly<{
  open: boolean
  deleting: boolean
  /** Rótulo do EXTRATO: conta (dados) e período importado — nomeia o que será excluído. Vazio → fallback. */
  accountLabel: string
  periodLabel: string
  /** Erro da exclusão (ex.: conciliadas/período fechado) — mostrado no modal em vez de fechar. */
  errorTag: string | null
  onConfirm: () => void
  onCancel: () => void
}>

export function DeleteStatementModal({
  open,
  deleting,
  accountLabel,
  periodLabel,
  errorTag,
  onConfirm,
  onCancel,
}: DeleteStatementModalProps) {
  if (!open) return null
  return (
    <div
      className={s.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-label={t('financial.recon.deleteStatement.title')}
      onClick={onCancel}
    >
      <div
        className={s.modalDialog}
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <header className={s.modalHead}>
          <h3 className={s.modalTitle}>{t('financial.recon.deleteStatement.title')}</h3>
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
            {accountLabel !== '' && periodLabel !== ''
              ? `${t('financial.recon.deleteStatement.qLead')} ${accountLabel} ${t('financial.recon.deleteStatement.qPeriod')} ${periodLabel}?`
              : t('financial.recon.deleteStatement.qFallback')}
          </p>
          <p>{t('financial.recon.deleteStatement.message')}</p>
        </div>

        {errorTag !== null ? <div className={s.errorText}>{t(errorTag)}</div> : null}

        <div className={s.modalFooter}>
          <button type="button" className={s.btnSecondary} disabled={deleting} onClick={onCancel}>
            {t('financial.recon.deleteStatement.cancel')}
          </button>
          <button type="button" className={s.modalBtnDanger} disabled={deleting} onClick={onConfirm}>
            {t('financial.recon.deleteStatement.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
