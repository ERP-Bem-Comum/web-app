/**
 * PatternBatchModal — view burra: sugere conciliar em LOTE as transações pendentes PARECIDAS (mesma
 * descrição + sinal) com o mesmo padrão que o usuário acabou de aplicar (ex.: 20 tarifas iguais). NUNCA
 * concilia sem confirmação: lista as candidatas (pré-marcadas), o usuário revisa/desmarca e confirma.
 * Só p/ tipos sem conta de destino (Tarifa/Pagamento/Recebimento) — limitação do batch do backend. Só props.
 */
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { LinkIcon } from '#shared/ui/icons/index.ts'

import * as s from '../page/reconciliation-workspace.css.ts'
import type { WorkspaceBinding } from '../reconciliation-workspace.binding.ts'

const t = createTranslator(ptBR)
const CLOSE_GLYPH = '✕'
const CHECK_GLYPH = '✓'

export type PatternBatchModalProps = Readonly<{ binding: WorkspaceBinding['patternBatch'] }>

export function PatternBatchModal({ binding }: PatternBatchModalProps) {
  if (!binding.active) return null
  return (
    <div
      className={s.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-label={t('financial.recon.pattern.title')}
      onClick={binding.onCancel}
    >
      <div
        className={s.modalDialog}
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <header className={s.modalHead}>
          <span className={s.modalHeadIc} aria-hidden>
            <LinkIcon />
          </span>
          <h3 className={s.modalTitle}>{t('financial.recon.pattern.title')}</h3>
          <button
            type="button"
            className={s.modalClose}
            aria-label={t('financial.recon.switch.close')}
            onClick={binding.onCancel}
          >
            {CLOSE_GLYPH}
          </button>
        </header>

        <div className={s.modalMessage}>
          <p>
            {t('financial.recon.pattern.intro')} <strong>{t(binding.typeTag)}</strong>.
          </p>
          <p>{t('financial.recon.pattern.review')}</p>
        </div>

        <div className={s.patternList}>
          {binding.candidates.map((c) => (
            <button
              key={c.id}
              type="button"
              className={c.checked ? s.patternRow.on : s.patternRow.off}
              aria-pressed={c.checked}
              onClick={() => {
                binding.toggle(c.id)
              }}
            >
              <span className={c.checked ? s.patternCb.on : s.patternCb.off} aria-hidden>
                {c.checked ? CHECK_GLYPH : ''}
              </span>
              <span className={s.patternRowDate}>{c.dateBR}</span>
              <span className={s.patternRowDesc}>{c.desc}</span>
              <span className={s.patternRowVal}>{c.valueBRL}</span>
            </button>
          ))}
        </div>

        {binding.errorTag !== null ? <p className={s.errorText}>{t(binding.errorTag)}</p> : null}

        <div className={s.modalFooter}>
          <button type="button" className={s.btnSecondary} onClick={binding.onCancel}>
            {t('financial.recon.pattern.cancel')}
          </button>
          <button
            type="button"
            className={s.modalBtnPrimary}
            disabled={binding.busy || binding.selectedCount === 0}
            onClick={binding.onConfirm}
          >
            {`${t('financial.recon.pattern.confirm')} (${String(binding.selectedCount)})`}
          </button>
        </div>
      </div>
    </div>
  )
}
