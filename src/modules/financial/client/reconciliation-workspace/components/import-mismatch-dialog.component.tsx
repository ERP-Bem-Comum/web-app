/**
 * ImportMismatchDialog — view burra: aviso de "conta diferente" no upload de OFX. Aparece quando o
 * `<BANKACCTFROM>` do arquivo NÃO bate com a conta da tela. Bloqueia o import direto e pede confirmação
 * ("Importar mesmo assim?") — front puro, sem backend. Recebe os rótulos por props.
 */
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import * as s from '../page/reconciliation-workspace.css.ts'

const t = createTranslator(ptBR)
const CLOSE_GLYPH = '✕'

export type ImportMismatchDialogProps = Readonly<{
  fileAccountLabel: string | null // null = sem aviso (não renderiza)
  currentAccountLabel: string
  onConfirm: () => void
  onCancel: () => void
}>

export function ImportMismatchDialog({
  fileAccountLabel,
  currentAccountLabel,
  onConfirm,
  onCancel,
}: ImportMismatchDialogProps) {
  if (fileAccountLabel === null) return null
  return (
    <div
      className={s.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-label={t('financial.recon.import.mismatch.title')}
      onClick={onCancel}
    >
      <div
        className={s.modalDialog}
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <header className={s.modalHead}>
          <h3 className={s.modalTitle}>{t('financial.recon.import.mismatch.title')}</h3>
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
          <p>{t('financial.recon.import.mismatch.intro')}</p>
          <p>
            <span className={s.modalMessageStrong}>{t('financial.recon.import.mismatch.fileLbl')}</span>{' '}
            {fileAccountLabel}
          </p>
          <p>
            <span className={s.modalMessageStrong}>{t('financial.recon.import.mismatch.currentLbl')}</span>{' '}
            {currentAccountLabel}
          </p>
          <p>{t('financial.recon.import.mismatch.question')}</p>
        </div>

        <div className={s.modalFooter}>
          <button type="button" className={s.btnSecondary} onClick={onCancel}>
            {t('financial.recon.import.mismatch.cancel')}
          </button>
          <button type="button" className={s.btnConfirm} onClick={onConfirm}>
            {t('financial.recon.import.mismatch.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
