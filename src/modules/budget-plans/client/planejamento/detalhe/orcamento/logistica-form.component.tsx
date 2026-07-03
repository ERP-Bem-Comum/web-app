/**
 * LogisticaForm — view do formulário de Logística (Tipo D, §1.8): pessoas/viagens + custos por viagem
 * (passagem, hospedagem·diárias, alimentação/transporte/carro·diárias) → cards-resumo (Passagens/Hospedagem/
 * Despesas) + Custo Total. Estado LOCAL; total ao vivo (`computeLogistica`). Front-first (persistência #113).
 */
import { useState, type ReactNode } from 'react'

import {
  computeLogistica,
  emptyLogisticaForm,
  type LogisticaForm as LogisticaFormState,
} from './logistica-calc.view-model.ts'
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
  row3,
  custoGrid,
  custoCell,
  custoCellLabel,
  custoCellValue,
  mesesRow,
  mesChip,
  mesChipOn,
} from './pessoal-form.css.ts'

export type LogisticaFormLabels = Readonly<{
  viagem: string
  pessoas: string
  viagens: string
  custos: string
  passagem: string
  hospedagem: string
  alimentacao: string
  transporte: string
  carroCombustivel: string
  diarias: string
  resumo: string
  resumoPassagens: string
  resumoHospedagem: string
  resumoDespesas: string
  meses: string
  mensal: string
  anual: string
  descartar: string
  salvar: string
}>

export type LogisticaFormProps = Readonly<{
  labels: LogisticaFormLabels
  initialMeses: readonly number[]
  monthAbbrevs: readonly string[]
  formatCents: (c: number) => string
  onDescartar: () => void
  onSalvar: (custoMensalCents: number, meses: readonly number[]) => void
}>

function NumField(
  props: Readonly<{ label: string; value: string; onChange: (v: string) => void }>,
): ReactNode {
  return (
    <label className={field}>
      <span className={fieldLabel}>{props.label}</span>
      <input
        className={fieldInput}
        inputMode="decimal"
        value={props.value}
        onChange={(e) => {
          props.onChange(e.target.value)
        }}
      />
    </label>
  )
}

export function LogisticaForm(props: LogisticaFormProps): ReactNode {
  const { labels: L, formatCents } = props
  const [form, setForm] = useState<LogisticaFormState>(() => emptyLogisticaForm(props.initialMeses))
  const calc = computeLogistica(form)
  const set =
    (k: keyof LogisticaFormState) =>
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
        <span className={configSectionTitle}>{L.viagem}</span>
        <div className={row2}>
          <NumField label={L.pessoas} value={form.pessoas} onChange={set('pessoas')} />
          <NumField label={L.viagens} value={form.viagens} onChange={set('viagens')} />
        </div>
      </div>

      <div className={configSection}>
        <span className={configSectionTitle}>{L.custos}</span>
        <NumField label={L.passagem} value={form.passagem} onChange={set('passagem')} />
        <div className={row2}>
          <NumField label={L.hospedagem} value={form.hospedagem} onChange={set('hospedagem')} />
          <NumField label={L.diarias} value={form.diariasHospedagem} onChange={set('diariasHospedagem')} />
        </div>
        <div className={row2}>
          <NumField label={L.alimentacao} value={form.alimentacao} onChange={set('alimentacao')} />
          <NumField label={L.diarias} value={form.diariasAlimentacao} onChange={set('diariasAlimentacao')} />
        </div>
        <div className={row2}>
          <NumField label={L.transporte} value={form.transporte} onChange={set('transporte')} />
          <NumField label={L.diarias} value={form.diariasTransporte} onChange={set('diariasTransporte')} />
        </div>
        <div className={row2}>
          <NumField
            label={L.carroCombustivel}
            value={form.carroCombustivel}
            onChange={set('carroCombustivel')}
          />
          <NumField label={L.diarias} value={form.diariasCarro} onChange={set('diariasCarro')} />
        </div>
      </div>

      <div className={configSection}>
        <span className={configSectionTitle}>{L.resumo}</span>
        <div className={row3}>
          <div className={custoCell}>
            <span className={custoCellLabel}>{L.resumoPassagens}</span>
            <span className={custoCellValue}>{formatCents(calc.passagensCents)}</span>
          </div>
          <div className={custoCell}>
            <span className={custoCellLabel}>{L.resumoHospedagem}</span>
            <span className={custoCellValue}>{formatCents(calc.hospedagemCents)}</span>
          </div>
          <div className={custoCell}>
            <span className={custoCellLabel}>{L.resumoDespesas}</span>
            <span className={custoCellValue}>{formatCents(calc.despesasCents)}</span>
          </div>
        </div>
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
