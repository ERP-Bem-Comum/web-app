import type { ReactNode } from 'react'

import type {
  CreatePlanForm,
  CreatePlanError,
  CreatePlanProgramOption,
  ImportYearsState,
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
  hint,
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
  importFromYearPlaceholder: string
  /** Spec 134 — por que o seletor de ano de origem não tem opção (a view não decide o texto). */
  importNeedsProgram: string
  importLoading: string
  importEmpty: string
  importFailed: string
  add: string
  cancel: string
}>

export type CreatePlanModalProps = Readonly<{
  open: boolean
  form: CreatePlanForm
  errorTag: CreatePlanError | null
  submitting: boolean
  programOptions: readonly CreatePlanProgramOption[]
  /** Spec 134 — anos com plano APROVADO do programa (sem o ano do plano novo), ou o motivo de não haver. */
  importYears: ImportYearsState
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

/** Texto que explica o seletor sem opções (spec 134); `null` quando há anos para escolher. */
const importHint = (state: ImportYearsState, labels: CreatePlanModalLabels): string | null => {
  switch (state.kind) {
    case 'needs-program':
      return labels.importNeedsProgram
    case 'loading':
      return labels.importLoading
    case 'empty':
      return labels.importEmpty
    case 'failed':
      return labels.importFailed
    case 'ready':
      return null
    default: {
      const _exhaustive: never = state
      return _exhaustive
    }
  }
}

/**
 * "Criar a partir do ano de" (spec 134). Lista só os anos em que o programa tem plano APROVADO — é dele que o
 * core copia. Sem anos, o seletor fica desabilitado E a razão aparece por escrito (não um seletor vazio).
 */
function ImportYearField(props: CreatePlanModalProps): ReactNode {
  const years = props.importYears.kind === 'ready' ? props.importYears.years : []
  const message = importHint(props.importYears, props.labels)
  return (
    <label className={field}>
      <span className={label}>{props.labels.importFromYear}</span>
      <select
        className={select}
        value={props.form.importFromYear}
        disabled={props.importYears.kind !== 'ready'}
        onChange={(e) => {
          props.onImportFromYear(e.target.value)
        }}
      >
        <option value="" disabled>
          {props.labels.importFromYearPlaceholder}
        </option>
        {years.map((y) => (
          <option key={y} value={String(y)}>
            {y}
          </option>
        ))}
      </select>
      {message !== null ? <p className={hint}>{message}</p> : null}
    </label>
  )
}

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
                <option key={p.ref} value={p.ref}>
                  {p.abbreviation}
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

          {props.form.importData ? <ImportYearField {...props} /> : null}

          {props.errorTag !== null ? (
            <p className={errorText}>{props.translateError(props.errorTag)}</p>
          ) : null}
        </div>

        <footer className={foot}>
          <button type="button" className={cancelButton} onClick={props.onClose}>
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
