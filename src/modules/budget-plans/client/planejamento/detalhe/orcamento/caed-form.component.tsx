/**
 * CaedForm — view do formulário CAED (Tipo C, §1.8): matrículas × custo unitário, DENTRO do drawer. Estado LOCAL;
 * total ao vivo (`computeCaed`). "Salvar" devolve o Custo Mensal + os meses ao pai. Front-first (persistência #113).
 * Renderiza o corpo rolável (seções) + o rodapé de ações do drawer (Descartar/Salvar).
 */
import { useState, type ReactNode } from 'react'

import {
  computeCaed,
  emptyCaedForm,
  type CaedForm as CaedFormState,
  type CaedForm as CaedFormValues,
} from './caed-calc.view-model.ts'
import {
  configForm,
  configSection,
  configSectionTitle,
  field,
  fieldLabel,
  fieldControl,
  fieldInput,
  labelMini,
  mesesRow,
  mesChip,
  mesChipOn,
  drawerBody,
  drawerFoot,
  cancelButton,
  applyButton,
} from './calculando-gastos.css.ts'
import { row2, custoGrid, custoCell, custoCellLabel, custoCellValue } from './pessoal-form.css.ts'

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
  /**
   * Devolve os INSUMOS junto do valor: o POST de cálculo manda os insumos e o core-api recalcula —
   * `custoMensalCents` serve só p/ o eco otimista na grade enquanto a escrita não volta.
   */
  onSalvar: (custoMensalCents: number, meses: readonly number[], form: CaedFormValues) => void
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
    <>
      <div className={drawerBody}>
        <div className={configForm}>
          <div className={configSection}>
            <h4 className={configSectionTitle}>{L.title}</h4>
            <div className={row2}>
              <label className={field}>
                <span className={fieldLabel}>{L.matriculas}</span>
                <div className={fieldControl}>
                  <input
                    className={fieldInput}
                    inputMode="numeric"
                    value={form.matriculas}
                    onChange={(e) => {
                      set('matriculas')(e.target.value)
                    }}
                  />
                </div>
              </label>
              <label className={field}>
                <span className={fieldLabel}>{L.custoUnitario}</span>
                <div className={fieldControl}>
                  <input
                    className={fieldInput}
                    inputMode="decimal"
                    value={form.custoUnitario}
                    onChange={(e) => {
                      set('custoUnitario')(e.target.value)
                    }}
                  />
                </div>
              </label>
            </div>
            <div>
              <p className={labelMini}>{L.meses}</p>
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
            </div>
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
        </div>
      </div>

      <div className={drawerFoot}>
        <button type="button" className={cancelButton} onClick={props.onDescartar}>
          {L.descartar}
        </button>
        <button
          type="button"
          className={applyButton}
          onClick={() => {
            props.onSalvar(calc.custoMensalCents, form.meses, form)
          }}
        >
          {L.salvar}
        </button>
      </div>
    </>
  )
}
