/**
 * ResetPasswordSuccessModal — componente BURRO (§XI): o modal de sucesso do "Redefinir Senha" (#038).
 * Usa o <dialog> nativo (top-layer, focus-trap, Escape, inerte do fundo, restauração de foco) — mesmo
 * padrão do forgot-password success-modal. Só props → JSX; o efeito de fechar/navegar vem por callback
 * (confirmar → login).
 */
import { useEffect, useId, useRef, type ReactNode } from 'react'

import { Button } from '#shared/ui/index.ts'

import { actions, confirmWrap, dialog, message, title } from './success-modal.css.ts'

export type ResetPasswordSuccessModalProps = Readonly<{
  open: boolean
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
}>

export function ResetPasswordSuccessModal(props: ResetPasswordSuccessModalProps): ReactNode {
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
        // Escape: previne o close nativo "solto" e roteia pelo handler controlado (confirma = fecha+login).
        e.preventDefault()
        props.onConfirm()
      }}
    >
      <h2 id={titleId} className={title}>
        {props.title}
      </h2>
      <p id={messageId} className={message}>
        {props.message}
      </p>
      <div className={actions}>
        <div className={confirmWrap}>
          <Button onClick={props.onConfirm}>{props.confirmLabel}</Button>
        </div>
      </div>
    </dialog>
  )
}
