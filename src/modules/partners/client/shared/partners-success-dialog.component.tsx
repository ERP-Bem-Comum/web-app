import { useEffect, useId, useRef, type ReactNode } from 'react'

import { Button, CheckCircleIcon } from '#shared/ui/index.ts'

import { actions, dialog, icon, message, okWrap, title } from './partners-success-dialog.css.ts'

export type PartnersSuccessDialogProps = Readonly<{
  open: boolean
  title: string
  message: string
  okLabel: string
  onConfirm: () => void
}>

/**
 * Modal INFORMATIVO de 1 botão (view burra — recebe `open`/`onConfirm` por props). Espelha o
 * confirm-dialog: `<dialog>` nativo via `showModal()` (focus-trap, Escape, top-layer). Sucesso =
 * check verde. Não há "cancelar": Escape e clique no backdrop equivalem a "Entendi" (onConfirm).
 */
export function PartnersSuccessDialog(props: PartnersSuccessDialogProps): ReactNode {
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
        // Escape: roteia pelo handler controlado (mantém o state), igual ao confirm-dialog.
        e.preventDefault()
        props.onConfirm()
      }}
      onClick={(e) => {
        // clique no backdrop (alvo = o próprio <dialog>) confirma; clique no conteúdo, não.
        if (e.target === ref.current) props.onConfirm()
      }}
    >
      <span className={icon}>
        <CheckCircleIcon size={48} />
      </span>
      <h2 id={titleId} className={title}>
        {props.title}
      </h2>
      <p id={messageId} className={message}>
        {props.message}
      </p>
      <div className={actions}>
        <div className={okWrap}>
          <Button onClick={props.onConfirm}>{props.okLabel}</Button>
        </div>
      </div>
    </dialog>
  )
}
