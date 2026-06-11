import { useEffect, useId, useRef, type ReactNode } from 'react'

import { Button } from '#shared/ui/index.ts'

import { actions, cancelButton, confirmWrap, dialog, message, title } from './partners-confirm-dialog.css.ts'

export type PartnersConfirmDialogProps = Readonly<{
  open: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  running: boolean
  onConfirm: () => void
  onCancel: () => void
}>

export function PartnersConfirmDialog(props: PartnersConfirmDialogProps): ReactNode {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const messageId = useId()

  // Sincroniza o <dialog> nativo com `open`. `showModal()` entrega de graça: focus-trap, Escape,
  // inerte do fundo, top-layer (acima do chrome sem z-index) e restauração de foco ao fechar.
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
        // Escape: previne o close nativo "solto" e roteia pelo handler controlado (mantém o state).
        e.preventDefault()
        props.onCancel()
      }}
      onClick={(e) => {
        // clique no backdrop (alvo = o próprio <dialog>) cancela; clique no conteúdo, não.
        if (e.target === ref.current) props.onCancel()
      }}
    >
      <h2 id={titleId} className={title}>
        {props.title}
      </h2>
      <p id={messageId} className={message}>
        {props.message}
      </p>
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
