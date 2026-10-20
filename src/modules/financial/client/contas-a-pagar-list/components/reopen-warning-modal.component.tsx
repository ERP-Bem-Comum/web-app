/**
 * ReopenWarningModal — view BURRA (§XI): alerta reforçado do "Voltar para edição" (spec 119, P.O. 19/10).
 * Só aparece quando algum documento da seleção JÁ teve baixa desfeita: o título já foi pago
 * antes, e devolvê-lo para edição é operação fora da rotina. Estado mora na page.
 */
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import type { StatusTarget } from '../contas-a-pagar.view-model.ts'
import {
  confirmOverlay,
  confirmDialog,
  confirmTitle,
  confirmText,
  confirmWarn,
  confirmList,
  confirmActions,
  confirmCancelBtn,
  confirmDeleteBtn,
} from '../page/contas-a-pagar.css.ts'

const t = createTranslator(ptBR)

export type ReopenWarningModalProps = Readonly<{
  targets: readonly StatusTarget[] | null // null = fechado
  running: boolean
  onConfirm: () => void
  onCancel: () => void
}>

export function ReopenWarningModal(props: ReopenWarningModalProps): ReactNode {
  if (props.targets === null) return null
  return (
    <div className={confirmOverlay} role="alertdialog" aria-modal="true" onClick={props.onCancel}>
      <div
        className={confirmDialog}
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <h2 className={confirmTitle}>{t('financial.list.reopenWarning.title')}</h2>
        <p className={confirmWarn}>{t('financial.list.reopenWarning.risk')}</p>
        <p className={confirmText}>{t('financial.list.reopenWarning.advice')}</p>
        <ul className={confirmList}>
          {props.targets.map((target) => (
            <li key={target.id}>{target.documentNumber}</li>
          ))}
        </ul>
        <div className={confirmActions}>
          <button type="button" className={confirmCancelBtn} onClick={props.onCancel}>
            {t('financial.list.reopenWarning.cancel')}
          </button>
          <button
            type="button"
            className={confirmDeleteBtn}
            disabled={props.running}
            onClick={props.onConfirm}
          >
            {t('financial.list.reopenWarning.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
