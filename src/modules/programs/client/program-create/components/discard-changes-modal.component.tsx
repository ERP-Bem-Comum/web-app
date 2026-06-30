import { useEffect, useId, useRef, type ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import { dialog, iconWrap, message, actions, confirmButton, cancelButton } from './discard-changes-modal.css.ts'

const t = createTranslator(ptBR)

/**
 * Modal "descartar alterações" (print do legado): ícone de info + aviso + 2 botões empilhados
 * (Sim, descartar / Não descartar). <dialog> nativo (focus-trap, Escape, top-layer).
 */
export type DiscardChangesModalProps = Readonly<{
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}>

function InfoIcon(): ReactNode {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
}

export function DiscardChangesModal(props: DiscardChangesModalProps): ReactNode {
  const ref = useRef<HTMLDialogElement>(null)
  const msgId = useId()

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
      aria-describedby={msgId}
      onCancel={(e) => { e.preventDefault(); props.onCancel() }}
      onClick={(e) => { if (e.target === ref.current) props.onCancel() }}
    >
      <span className={iconWrap} aria-hidden="true"><InfoIcon /></span>
      <p id={msgId} className={message}>{t('programs.discard.message')}</p>
      <div className={actions}>
        <button type="button" className={confirmButton} onClick={props.onConfirm}>
          {t('programs.discard.confirm')}
        </button>
        <button type="button" className={cancelButton} onClick={props.onCancel}>
          {t('programs.discard.cancel')}
        </button>
      </div>
    </dialog>
  )
}
