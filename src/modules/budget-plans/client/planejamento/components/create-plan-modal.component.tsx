import type { ReactNode } from 'react'

import type {
  CreatePlanForm,
  CreatePlanError,
} from '#modules/budget-plans/client/planejamento/create-plan.view-model.ts'

import {
  overlay,
  modal,
  head,
  title,
  close,
  body,
  field,
  label,
  input,
  select,
  toggleRow,
  toggleLabel,
  errorText,
  foot,
  cancelButton,
  addButton,
} from './create-plan-modal.css.ts'

const CLOSE_GLYPH = '✕'

export type CreatePlanModalLabels = Readonly<{
  title: string
  close: string
  year: string
  program: string
  programPlaceholder: string
  importData: string
  importFromYear: string
  add: string
  cancel: string
}>

export type CreatePlanModalProps = Readonly<{
  open: boolean
  form: CreatePlanForm
  errorTag: CreatePlanError | null
  programOptions: readonly string[]
  importYears: readonly number[]
  labels: CreatePlanModalLabels
  /** Traduz a tag do erro (a view não conhece o catálogo diretamente). */
  translateError: (tag: CreatePlanError) => string
  onClose: () => void
  onYear: (v: string) => void
  onProgram: (v: string) => void
  onToggleImport: (v: boolean) => void
  onImportFromYear: (v: string) => void
  onSubmit: () => void
}>

/**
 * Modal "Adicionar Plano Orçamentário" (view BURRA §1.2). Ano (texto) + Programa (dropdown) + toggle
 * "Importar dados" → "Criar a partir do ano de" (dropdown). Form-state vem do controller por props; a view
 * só apresenta e aciona callbacks.
 */
export function CreatePlanModal(props: CreatePlanModalProps): ReactNode {
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
            <span className={label}>{props.labels.year}</span>
            <input
              className={input}
              type="text"
              inputMode="numeric"
              value={props.form.year}
              onChange={(e) => {
                props.onYear(e.target.value)
              }}
            />
          </label>

          <label className={field}>
            <span className={label}>{props.labels.program}</span>
            <select
              className={select}
              value={props.form.program}
              onChange={(e) => {
                props.onProgram(e.target.value)
              }}
            >
              <option value="" disabled>
                {props.labels.programPlaceholder}
              </option>
              {props.programOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <div className={toggleRow}>
            <input
              id="create-plan-import"
              type="checkbox"
              checked={props.form.importData}
              onChange={(e) => {
                props.onToggleImport(e.target.checked)
              }}
            />
            <label htmlFor="create-plan-import" className={toggleLabel}>
              {props.labels.importData}
            </label>
          </div>

          {props.form.importData ? (
            <label className={field}>
              <span className={label}>{props.labels.importFromYear}</span>
              <select
                className={select}
                value={props.form.importFromYear}
                onChange={(e) => {
                  props.onImportFromYear(e.target.value)
                }}
              >
                <option value="" disabled>
                  {props.labels.importFromYear}
                </option>
                {props.importYears.map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {props.errorTag !== null ? (
            <p className={errorText}>{props.translateError(props.errorTag)}</p>
          ) : null}
        </div>

        <footer className={foot}>
          <button type="button" className={cancelButton} onClick={props.onClose}>
            {props.labels.cancel}
          </button>
          <button type="button" className={addButton} onClick={props.onSubmit}>
            {props.labels.add}
          </button>
        </footer>
      </div>
    </div>
  )
}
