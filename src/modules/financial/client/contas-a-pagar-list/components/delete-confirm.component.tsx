/**
 * DeleteConfirmModal — view BURRA (§XI): modal de confirmação de EXCLUSÃO (hard-delete). Avisa que a
 * exclusão é definitiva e que **os títulos-filho (retenções), se existirem, também são apagados**. Só
 * aparece quando `open`. Confirma/cancela via callbacks. Fecha ao clicar fora ou no Cancelar.
 */
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import {
  confirmOverlay,
  confirmDialog,
  confirmTitle,
  confirmText,
  confirmWarn,
  confirmActions,
  confirmCancelBtn,
  confirmDeleteBtn,
} from '../page/contas-a-pagar.css.ts'

const t = createTranslator(ptBR)

export type DeleteConfirmModalProps = Readonly<{
  open: boolean
  count: number // quantos documentos (Aberto) serão excluídos
  draftCount: number // rascunhos na seleção que NÃO podem ser excluídos (backend) — avisa
  running: boolean
  onConfirm: () => void
  onCancel: () => void
}>

export function DeleteConfirmModal(props: DeleteConfirmModalProps): ReactNode {
  if (!props.open) return null
  return (
    <div className={confirmOverlay} role="dialog" aria-modal="true" onClick={props.onCancel}>
      <div
        className={confirmDialog}
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <h2 className={confirmTitle}>{t('financial.list.delete.title')}</h2>
        <p className={confirmText}>
          {props.count === 1
            ? t('financial.list.delete.bodyOne')
            : `${t('financial.list.delete.bodyManyPrefix')} ${String(props.count)} ${t('financial.list.delete.bodyManySuffix')}`}
        </p>
        <p className={confirmWarn}>{t('financial.list.delete.warnChildren')}</p>
        {props.draftCount > 0 ? (
          <p className={confirmText}>{t('financial.list.delete.draftSkipped')}</p>
        ) : null}
        <div className={confirmActions}>
          <button type="button" className={confirmCancelBtn} onClick={props.onCancel}>
            {t('financial.list.delete.cancel')}
          </button>
          <button
            type="button"
            className={confirmDeleteBtn}
            disabled={props.running || props.count === 0}
            onClick={props.onConfirm}
          >
            {props.running ? t('common.loading') : t('financial.list.delete.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
