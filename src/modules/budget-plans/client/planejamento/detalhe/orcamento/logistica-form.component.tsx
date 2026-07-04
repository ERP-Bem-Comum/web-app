/**
 * LogisticaForm — view do formulário de Logística (Tipo D, §1.8): pessoas/viagens + custos por viagem
 * (passagem, hospedagem·diárias, alimentação/transporte/carro·diárias) → cards-resumo (Passagens/Hospedagem/
 * Despesas) + Custo Total, DENTRO do drawer. Estado LOCAL; total ao vivo (`computeLogistica`). Front-first
 * (persistência #113). Renderiza o corpo rolável (seções) + o rodapé de ações do drawer (Descartar/Salvar).
 */
import { useState, type ReactNode } from 'react'

import {
  computeLogistica,
  emptyLogisticaForm,
  type LogisticaForm as LogisticaFormState,
} from './logistica-calc.view-model.ts'
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
  sumRow,
  sumBox,
  sumBoxLabel,
  sumBoxValue,
  drawerBody,
  drawerFoot,
  cancelButton,
  applyButton,
} from './calculando-gastos.css.ts'
import { row2, custoGrid, custoCell, custoCellLabel, custoCellValue } from './pessoal-form.css.ts'

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
      <div className={fieldControl}>
        <input
          className={fieldInput}
          inputMode="decimal"
          value={props.value}
          onChange={(e) => {
            props.onChange(e.target.value)
          }}
        />
      </div>
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
    <>
      <div className={drawerBody}>
        <div className={configForm}>
          <div className={configSection}>
            <h4 className={configSectionTitle}>{L.viagem}</h4>
            <div className={row2}>
              <NumField label={L.pessoas} value={form.pessoas} onChange={set('pessoas')} />
              <NumField label={L.viagens} value={form.viagens} onChange={set('viagens')} />
            </div>
          </div>

          <div className={configSection}>
            <h4 className={configSectionTitle}>{L.custos}</h4>
            <NumField label={L.passagem} value={form.passagem} onChange={set('passagem')} />
            <div className={row2}>
              <NumField label={L.hospedagem} value={form.hospedagem} onChange={set('hospedagem')} />
              <NumField
                label={L.diarias}
                value={form.diariasHospedagem}
                onChange={set('diariasHospedagem')}
              />
            </div>
            <div className={row2}>
              <NumField label={L.alimentacao} value={form.alimentacao} onChange={set('alimentacao')} />
              <NumField
                label={L.diarias}
                value={form.diariasAlimentacao}
                onChange={set('diariasAlimentacao')}
              />
            </div>
            <div className={row2}>
              <NumField label={L.transporte} value={form.transporte} onChange={set('transporte')} />
              <NumField
                label={L.diarias}
                value={form.diariasTransporte}
                onChange={set('diariasTransporte')}
              />
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
            <h4 className={configSectionTitle}>{L.resumo}</h4>
            <div className={sumRow}>
              <div className={sumBox}>
                <div className={sumBoxLabel}>{L.resumoPassagens}</div>
                <div className={sumBoxValue}>{formatCents(calc.passagensCents)}</div>
              </div>
              <div className={sumBox}>
                <div className={sumBoxLabel}>{L.resumoHospedagem}</div>
                <div className={sumBoxValue}>{formatCents(calc.hospedagemCents)}</div>
              </div>
              <div className={sumBox}>
                <div className={sumBoxLabel}>{L.resumoDespesas}</div>
                <div className={sumBoxValue}>{formatCents(calc.despesasCents)}</div>
              </div>
            </div>
          </div>

          <div className={configSection}>
            <h4 className={configSectionTitle}>{L.meses}</h4>
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
            props.onSalvar(calc.custoMensalCents, form.meses)
          }}
        >
          {L.salvar}
        </button>
      </div>
    </>
  )
}
