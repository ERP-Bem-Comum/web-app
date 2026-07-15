/**
 * Modal "Adicionar Orçamento" (view BURRA §1.6). Dropdown Estado + footer Adicionar/Cancelar. O form-state,
 * as opções e o erro chegam por props (do binding); a view só apresenta e aciona callbacks.
 */
import type { ReactNode } from 'react'

import type { RegionOption } from '#modules/budget-plans/client/planejamento/detalhe/plan-detail.view-model.ts'
import type { AddBudgetError } from '#modules/budget-plans/client/planejamento/detalhe/add-budget.view-model.ts'

import {
  overlay,
  modal,
  head,
  title,
  close,
  body,
  field,
  label,
  select,
  errorText,
  foot,
  cancelButton,
  addButton,
} from './add-budget-modal.css.ts'

const CLOSE_GLYPH = '✕'

export type AddBudgetModalLabels = Readonly<{
  title: string
  close: string
  estado: string
  estadoPlaceholder: string
  add: string
  cancel: string
}>

export type AddBudgetModalProps = Readonly<{
  open: boolean
  estado: string
  options: readonly RegionOption[]
  submitting: boolean
  errorTag: AddBudgetError | null
  labels: AddBudgetModalLabels
  translateError: (tag: AddBudgetError) => string
  onClose: () => void
  onEstado: (v: string) => void
  onSubmit: () => void
}>

export function AddBudgetModal(props: AddBudgetModalProps): ReactNode {
  if (!props.open) return null
  return (
    <div className={overlay} role="dialog" aria-modal="true" aria-label={props.labels.title}>
      <div className={modal}>
        <header className={head}>
          <h2 className={title}>{props.labels.title}</h2>
          <button type="button" className={close} aria-label={props.labels.close} onClick={props.onClose}>
            {CLOSE_GLYPH}
          </button>
        </header>

        <div className={body}>
          <label className={field}>
            <span className={label}>{props.labels.estado}</span>
            <select
              className={select}
              value={props.estado}
              onChange={(e) => {
                props.onEstado(e.target.value)
              }}
            >
              <option value="" disabled>
                {props.labels.estadoPlaceholder}
              </option>
              {props.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          {props.errorTag !== null ? (
            <p className={errorText} role="alert">
              {props.translateError(props.errorTag)}
            </p>
          ) : null}
        </div>

        <footer className={foot}>
          <button type="button" className={cancelButton} onClick={props.onClose} disabled={props.submitting}>
            {props.labels.cancel}
          </button>
          <button type="button" className={addButton} onClick={props.onSubmit} disabled={props.submitting}>
            {props.labels.add}
          </button>
        </footer>
      </div>
    </div>
  )
}
