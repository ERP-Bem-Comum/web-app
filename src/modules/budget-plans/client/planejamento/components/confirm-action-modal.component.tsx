/**
 * ConfirmActionModal — modal de confirmação das ações do menu "…" (view BURRA §2.5). Corpo com a mensagem
 * (já interpolada), botão de confirmação normal ou vermelho (destrutiva) e um campo "Nome" opcional (Criar
 * Cenário). PlanFeedbackToast — toast de sucesso transitório. Todo o estado vem por props.
 */
import type { ReactNode } from 'react'

import {
  overlay,
  dialog,
  title,
  body,
  field,
  label,
  input,
  footer,
  cancelButton,
  confirmButton,
  confirmButtonDanger,
  toast,
} from './confirm-action-modal.css.ts'

export type ConfirmActionModalProps = Readonly<{
  open: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  danger: boolean
  /** Quando definido, mostra um campo "Nome" (ex.: Criar Cenário) e desabilita confirmar se vazio. */
  nameField?: Readonly<{ label: string; value: string; onChange: (v: string) => void }>
  onConfirm: () => void
  onClose: () => void
}>

export function ConfirmActionModal(props: ConfirmActionModalProps): ReactNode {
  if (!props.open) return null
  const confirmDisabled = props.nameField?.value.trim() === ''
  return (
    <div className={overlay} role="presentation">
      <div className={dialog} role="alertdialog" aria-modal="true" aria-label={props.title}>
        <h3 className={title}>{props.title}</h3>
        <p className={body}>{props.message}</p>

        {props.nameField !== undefined ? (
          <label className={field}>
            <span className={label}>{props.nameField.label}</span>
            <input
              className={input}
              value={props.nameField.value}
              onChange={(e) => {
                props.nameField?.onChange(e.target.value)
              }}
            />
          </label>
        ) : null}

        <div className={footer}>
          <button type="button" className={cancelButton} onClick={props.onClose}>
            {props.cancelLabel}
          </button>
          <button
            type="button"
            className={props.danger ? confirmButtonDanger : confirmButton}
            disabled={confirmDisabled}
            onClick={props.onConfirm}
          >
            {props.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export type PlanFeedbackToastProps = Readonly<{ message: string | null }>

export function PlanFeedbackToast(props: PlanFeedbackToastProps): ReactNode {
  if (props.message === null) return null
  return (
    <div className={toast} role="status" aria-live="polite">
      {props.message}
    </div>
  )
}
