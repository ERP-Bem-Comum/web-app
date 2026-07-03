/**
 * CaedForm — view do formulário CAED (Tipo C, §1.8): matrículas × custo unitário. Estado LOCAL; total ao vivo
 * (`computeCaed`). "Salvar" devolve o Custo Mensal + os meses ao pai. Front-first (persistência #113).
 */
import { useState, type ReactNode } from 'react'

import { computeCaed, emptyCaedForm, type CaedForm as CaedFormState } from './caed-calc.view-model.ts'
import {
  configSection,
  configSectionTitle,
  field,
  fieldLabel,
  fieldInput,
  formActions,
  cancelButton,
  applyButton,
} from './calculando-gastos.css.ts'
import {
  form as pfForm,
  row2,
  custoGrid,
  custoCell,
  custoCellLabel,
  custoCellValue,
  mesesRow,
  mesChip,
  mesChipOn,
} from './pessoal-form.css.ts'

export type CaedFormLabels = Readonly<{
  title: string
  matriculas: string
  custoUnitario: string
  meses: string
  mensal: string
  anual: string
  descartar: string
  salvar: string
}>

export type CaedFormProps = Readonly<{
  labels: CaedFormLabels
  initialMeses: readonly number[]
  monthAbbrevs: readonly string[]
  formatCents: (c: number) => string
  onDescartar: () => void
  onSalvar: (custoMensalCents: number, meses: readonly number[]) => void
}>

export function CaedForm(props: CaedFormProps): ReactNode {
  const { labels: L, formatCents } = props
  const [form, setForm] = useState<CaedFormState>(() => emptyCaedForm(props.initialMeses))
  const calc = computeCaed(form)
  const set =
    (k: 'matriculas' | 'custoUnitario') =>
    (v: string): void => {
      setForm((f) => ({ ...f, [k]: v }))
    }
  const toggleMes = (i: number): void => {
    setForm((f) => ({
      ...f,
      meses: f.meses.includes(i) ? f.meses.filter((m) => m !== i) : [...f.meses, i],
    }))
  }

  return (
    <div className={pfForm}>
      <div className={configSection}>
        <span className={configSectionTitle}>{L.title}</span>
        <div className={row2}>
          <label className={field}>
            <span className={fieldLabel}>{L.matriculas}</span>
            <input
              className={fieldInput}
              inputMode="numeric"
              value={form.matriculas}
              onChange={(e) => {
                set('matriculas')(e.target.value)
              }}
            />
          </label>
          <label className={field}>
            <span className={fieldLabel}>{L.custoUnitario}</span>
            <input
              className={fieldInput}
              inputMode="decimal"
              value={form.custoUnitario}
              onChange={(e) => {
                set('custoUnitario')(e.target.value)
              }}
            />
          </label>
        </div>
        <label className={field}>
          <span className={fieldLabel}>{L.meses}</span>
          <div className={mesesRow}>
            {props.monthAbbrevs.map((m, i) => (
              <button
                key={m}
                type="button"
                className={form.meses.includes(i) ? `${mesChip} ${mesChipOn}` : mesChip}
                onClick={() => {
                  toggleMes(i)
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </label>
      </div>

      <div className={custoGrid}>
        <div className={custoCell}>
          <span className={custoCellLabel}>{L.mensal}</span>
          <span className={custoCellValue}>{formatCents(calc.custoMensalCents)}</span>
        </div>
        <div className={custoCell}>
          <span className={custoCellLabel}>{L.anual}</span>
          <span className={custoCellValue}>{formatCents(calc.custoAnualCents)}</span>
        </div>
      </div>

      <div className={formActions}>
        <button type="button" className={cancelButton} onClick={props.onDescartar}>
          {L.descartar}
        </button>
        <button
          type="button"
          className={applyButton}
          onClick={() => {
            props.onSalvar(calc.custoMensalCents, form.meses)
          }}
        >
          {L.salvar}
        </button>
      </div>
    </div>
  )
}
