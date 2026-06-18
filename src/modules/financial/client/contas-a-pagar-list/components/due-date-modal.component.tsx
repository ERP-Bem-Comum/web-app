/**
 * DueDateModal — view BURRA (§XI): modal de "Alterar vencimento" para 1+ títulos selecionados. Recebe o
 * valor da data + onChange (estado mora na page) e aplica via callback. Avisa quando há selecionados que
 * não são Aberto (não alteráveis pelo core-api). Só aparece quando `open`.
 */
import type { ChangeEvent, ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import {
  confirmOverlay,
  confirmDialog,
  confirmTitle,
  confirmText,
  confirmDateInput,
  confirmActions,
  confirmCancelBtn,
  confirmPrimaryBtn,
} from '../page/contas-a-pagar.css.ts'

const t = createTranslator(ptBR)

export type DueDateModalProps = Readonly<{
  open: boolean
  count: number // títulos (Aberto) que receberão o novo vencimento
  blockedCount: number // selecionados em outro status (não alteráveis) — aviso
  value: string // YYYY-MM-DD
  running: boolean
  onChange: (value: string) => void
  onApply: () => void
  onCancel: () => void
}>

export function DueDateModal(props: DueDateModalProps): ReactNode {
  if (!props.open) return null
  const onChange = (e: ChangeEvent<HTMLInputElement>): void => {
    props.onChange(e.target.value)
  }
  return (
    <div className={confirmOverlay} role="dialog" aria-modal="true" onClick={props.onCancel}>
      <div
        className={confirmDialog}
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <h2 className={confirmTitle}>{t('financial.list.dueDate.modalTitle')}</h2>
        <p className={confirmText}>
          {props.count === 1
            ? t('financial.list.dueDate.modalBodyOne')
            : `${t('financial.list.dueDate.modalBodyManyPrefix')} ${String(props.count)} ${t('financial.list.dueDate.modalBodyManySuffix')}`}
        </p>
        <input
          type="date"
          className={confirmDateInput}
          value={props.value}
          aria-label={t('financial.list.dueDate.modalTitle')}
          onChange={onChange}
        />
        {props.blockedCount > 0 ? (
          <p className={confirmText}>{t('financial.list.dueDate.modalBlocked')}</p>
        ) : null}
        <div className={confirmActions}>
          <button type="button" className={confirmCancelBtn} onClick={props.onCancel}>
            {t('financial.list.dueDate.modalCancel')}
          </button>
          <button
            type="button"
            className={confirmPrimaryBtn}
            disabled={props.running || props.value === '' || props.count === 0}
            onClick={props.onApply}
          >
            {props.running ? t('common.loading') : t('financial.list.dueDate.modalApply')}
          </button>
        </div>
      </div>
    </div>
  )
}
