/**
 * PaymentDateModal — view BURRA (§XI): modal de "Marcar como pago" para 1+ títulos Aprovados. Coleta a
 * DATA DE PAGAMENTO (= data da saída bancária, geralmente retroativa) que ancora o match da conciliação
 * (#224/#232). Estado mora na page; aplica via callback. Só aparece quando `open`.
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

export type PaymentDateModalProps = Readonly<{
  open: boolean
  count: number // títulos (Aprovado) que receberão a baixa
  value: string // YYYY-MM-DD (data de pagamento)
  running: boolean
  onChange: (value: string) => void
  onApply: () => void
  onCancel: () => void
}>

export function PaymentDateModal(props: PaymentDateModalProps): ReactNode {
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
        <h2 className={confirmTitle}>{t('financial.list.pay.modalTitle')}</h2>
        <p className={confirmText}>
          {props.count === 1
            ? t('financial.list.pay.modalBodyOne')
            : `${t('financial.list.pay.modalBodyManyPrefix')} ${String(props.count)} ${t('financial.list.pay.modalBodyManySuffix')}`}
        </p>
        <input
          type="date"
          className={confirmDateInput}
          value={props.value}
          aria-label={t('financial.list.pay.dateLabel')}
          onChange={onChange}
        />
        <div className={confirmActions}>
          <button type="button" className={confirmCancelBtn} onClick={props.onCancel}>
            {t('financial.list.pay.modalCancel')}
          </button>
          <button
            type="button"
            className={confirmPrimaryBtn}
            disabled={props.running || props.value === '' || props.count === 0}
            onClick={props.onApply}
          >
            {props.running ? t('common.loading') : t('financial.list.pay.modalApply')}
          </button>
        </div>
      </div>
    </div>
  )
}
