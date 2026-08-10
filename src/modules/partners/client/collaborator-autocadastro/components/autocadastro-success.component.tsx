/**
 * AutocadastroSuccessModal — componente BURRO (§XI): o modal de conclusão do Autocadastro (#040).
 * Usa o <dialog> nativo (top-layer, focus-trap, Escape, inerte do fundo, restauração de foco) — mesmo
 * padrão do reset-password success-modal. Diferença: NÃO exige login (o colaborador pode não ter conta);
 * o confirmar apenas reconhece a conclusão (fecha o modal). Só props → JSX; efeitos vêm por callback.
 */
import { useEffect, useId, useRef, type ReactNode } from 'react'

import { Button } from '#shared/ui/index.ts'

import { actions, confirmWrap, dialog, message, title } from './autocadastro-success.css.ts'

export type AutocadastroSuccessModalProps = Readonly<{
  open: boolean
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
}>

export function AutocadastroSuccessModal(props: AutocadastroSuccessModalProps): ReactNode {
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
