/**
 * CancelContractModal — modal de confirmação de CANCELAMENTO de contrato Pendente (componente BURRO).
 * O cancelamento é um soft-delete (§1.7, #32): Pendente → Cancelado (o registro é preservado). O
 * gatilho só oferece a ação p/ contratos Pendente (`canCancelContract`); o 409 ContractNotPending é a
 * defesa do backend (mapeado p/ `contracts.error.contract-not-pending`). NÃO é exclusão física (antes
 * o botão ficava gated por 405 — comentário stale removido).
 */
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import {
  overlay,
  content,
  title,
  label,
  body,
  aviso,
  footer,
  buttonSecondary,
  buttonDanger,
} from './delete-contract-modal.css.ts'

const t = createTranslator(ptBR)

export interface DeleteContractModalProps {
  readonly open: boolean
  readonly contractLabel: string
  readonly onClose: () => void
  readonly onConfirm: () => void
  /** Cancelamento em andamento (mutation pendente) — desabilita os botões. */
  readonly running?: boolean
  /** Tag i18n de erro (ex.: 409 contract-not-pending) — exibida no corpo do modal. */
  readonly errorTag?: string | null
}

export function DeleteContractModal({
  open,
  contractLabel,
  onClose,
  onConfirm,
  running = false,
  errorTag = null,
}: DeleteContractModalProps): ReactNode {
  if (!open) return null

  return (
    <div className={overlay} onClick={onClose} role="presentation">
      <div
        className={content}
        role="alertdialog"
        aria-modal="true"
        aria-label={t('contracts.cancel.title')}
        onClick={(e) => { e.stopPropagation() }}
      >
        <h2 className={title}>{t('contracts.cancel.title')}</h2>
        <span className={label}>{contractLabel}</span>
        <p className={body}>{t('contracts.cancel.body')}</p>
        {errorTag !== null ? (
          <div className={aviso} role="alert">{t(errorTag)}</div>
        ) : null}
        <div className={footer}>
          <button type="button" className={buttonSecondary} onClick={onClose} disabled={running}>
            {t('contracts.cancel.cancel')}
          </button>
          <button
            type="button"
            className={buttonDanger}
            disabled={running}
            onClick={onConfirm}
          >
            {t('contracts.cancel.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
