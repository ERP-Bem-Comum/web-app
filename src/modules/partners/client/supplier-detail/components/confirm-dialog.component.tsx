import type { ReactNode } from 'react'

import { Button } from '#shared/ui/index.ts'

import {
  actions,
  cancelButton,
  confirmWrap,
  dialog,
  message,
  overlay,
  title,
} from './confirm-dialog.css.ts'

export type ConfirmDialogProps = Readonly<{
  open: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  running: boolean
  onConfirm: () => void
  onCancel: () => void
}>

export function ConfirmDialog(props: ConfirmDialogProps): ReactNode {
  if (!props.open) return null
  return (
    <div className={overlay} role="presentation" onClick={props.onCancel}>
      <div
        className={dialog}
        role="alertdialog"
        aria-modal="true"
        aria-label={props.title}
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <h2 className={title}>{props.title}</h2>
        <p className={message}>{props.message}</p>
        <div className={actions}>
          <button type="button" className={cancelButton} onClick={props.onCancel}>
            {props.cancelLabel}
          </button>
          <div className={confirmWrap}>
            <Button onClick={props.onConfirm} loading={props.running} loadingLabel={props.confirmLabel}>
              {props.confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
