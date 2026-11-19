/**
 * Diálogo "Inativar colaborador" (spec 133) — view burra. Mesmo <dialog> nativo do
 * `PartnersConfirmDialog`, com um <select> de Motivo obrigatório: Confirmar só habilita com motivo.
 */
import { useEffect, useId, useRef, type ReactNode } from 'react'

import { Button } from '#shared/ui/index.ts'
import { ChevronDownIcon } from '#shared/ui/icons/index.ts'
import { chevron, control, field, fieldLabel, req, select } from '#shared/ui/brand/brand-form.css.ts'
import {
  actions,
  cancelButton,
  confirmWrap,
  dialog,
  message,
  title,
} from '#modules/partners/client/shared/partners-confirm-dialog.css.ts'

export type CollaboratorDeactivateDialogProps = Readonly<{
  open: boolean
  title: string
  message: string
  reasonLabel: string
  reasonPlaceholder: string
  reasonOptions: readonly Readonly<{ value: string; label: string }>[]
  reason: string
  confirmLabel: string
  cancelLabel: string
  canConfirm: boolean
  running: boolean
  errorMessage: string | null
  onReasonChange: (value: string) => void
  onConfirm: () => void
  onCancel: () => void
}>

export function CollaboratorDeactivateDialog(props: CollaboratorDeactivateDialogProps): ReactNode {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const messageId = useId()
  const reasonId = useId()

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
      <h2 id={titleId} className={title}>
        {props.title}
      </h2>
      <p id={messageId} className={message}>
        {props.message}
      </p>

      <div className={field}>
        <label htmlFor={reasonId} className={fieldLabel}>
          {props.reasonLabel}
          <span className={req} aria-hidden="true">
            *
          </span>
        </label>
        <div className={control}>
          <select
            id={reasonId}
            className={select}
            value={props.reason}
            required
            disabled={props.running}
            onChange={(e) => {
              props.onReasonChange(e.target.value)
            }}
          >
            <option value="">{props.reasonPlaceholder}</option>
            {props.reasonOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span className={chevron}>
            <ChevronDownIcon size={16} />
          </span>
        </div>
      </div>

      {props.errorMessage !== null ? (
        <p className={message} role="alert">
          {props.errorMessage}
        </p>
      ) : null}

      <div className={actions}>
        <button type="button" className={cancelButton} onClick={props.onCancel}>
          {props.cancelLabel}
        </button>
        <div className={confirmWrap}>
          <Button
            onClick={props.onConfirm}
            disabled={!props.canConfirm}
            loading={props.running}
            loadingLabel={props.confirmLabel}
          >
            {props.confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
