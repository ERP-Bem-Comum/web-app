/**
 * DeleteContractModal — modal de confirmação de exclusão de contrato (componente BURRO).
 * O backend ainda PROÍBE exclusão física (405 `contract-delete-forbidden`, imutabilidade), então o
 * botão "Confirmar" fica DESABILITADO com aviso até existir suporte de cancelamento/soft-delete
 * (ver handbook/core-api/tickets/CTR-DELETE-CANCEL.md). Quando o backend suportar, basta habilitar o
 * confirmar + ligar `onConfirm` ao binding de exclusão.
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
  /** Enquanto o backend não suportar exclusão, o confirmar fica desabilitado com aviso. */
  readonly confirmDisabled: boolean
}

export function DeleteContractModal({
  open,
  contractLabel,
  onClose,
  onConfirm,
  confirmDisabled,
}: DeleteContractModalProps): ReactNode {
  if (!open) return null

  return (
    <div className={overlay} onClick={onClose} role="presentation">
      <div
        className={content}
        role="alertdialog"
        aria-modal="true"
        aria-label={t('contracts.list.delete.title')}
        onClick={(e) => { e.stopPropagation() }}
      >
        <h2 className={title}>{t('contracts.list.delete.title')}</h2>
        <span className={label}>{contractLabel}</span>
        <p className={body}>{t('contracts.list.delete.body')}</p>
        {confirmDisabled ? (
          <div className={aviso} role="alert">{t('contracts.list.delete.unavailable')}</div>
        ) : null}
        <div className={footer}>
          <button type="button" className={buttonSecondary} onClick={onClose}>
            {t('contracts.list.delete.cancel')}
          </button>
          <button
            type="button"
            className={buttonDanger}
            disabled={confirmDisabled}
            onClick={onConfirm}
          >
            {t('contracts.list.delete.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
