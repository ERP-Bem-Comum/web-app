import { useEffect, useId, useRef, type ReactNode } from 'react'

import { Button } from '#shared/ui/index.ts'

import { actions, cancelButton, confirmWrap, dialog, message, title } from './confirm-dialog.css.ts'

/**
 * ConfirmDialog do módulo Usuários — <dialog> nativo (focus-trap, Escape, inert, top-layer de graça).
 * Reusado pela inclusão (confirmar criação) e pelo detalhe (confirmar ativar/desativar). Espelha o
 * confirm-dialog do ACT.
 */
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
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const messageId = useId()

  useEffect(() => {
    const el = ref.current
    if (el === null) return
    if (props.open && !el.open) el.showModal()
    else if (!props.open && el.open) el.close()
  }, [props.open])

  return (
    <dialog
      ref={ref}
      className={dialog}
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onCancel={(e) => {
        e.preventDefault()
        props.onCancel()
      }}
      onClick={(e) => {
        if (e.target === ref.current) props.onCancel()
      }}
    >
      <h2 id={titleId} className={title}>{props.title}</h2>
      <p id={messageId} className={message}>{props.message}</p>
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
    </dialog>
  )
}
