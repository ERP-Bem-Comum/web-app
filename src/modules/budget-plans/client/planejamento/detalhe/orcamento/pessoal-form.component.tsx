/**
 * PessoalForm — view do formulário de custo de pessoal (US2.4c, frame 4). Estado LOCAL (o que o usuário
 * digita); os totais são derivados ao vivo (`computePessoal`). "Salvar" devolve o Custo Mensal + os meses
 * ao pai (que aplica no grid — frame 5). Front-first: persistência real chega com o backend (#113).
 */
import { useState, type ReactNode } from 'react'

import {
  computePessoal,
  emptyPessoalForm,
  type PessoalForm as PessoalFormState,
} from './pessoal-calc.view-model.ts'
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
  derivedInput,
  custoGrid,
  custoCell,
  custoCellLabel,
  custoCellValue,
  mesesRow,
  mesChip,
  mesChipOn,
} from './pessoal-form.css.ts'

export type PessoalFormLabels = Readonly<{
  tipo: string
  nivel: string
  vinculo: string
  remuneracao: string
  qtd: string
  meses: string
  salario: string
  reajuste: string
  salarioTotal: string
  encargos: string
  inssPatronal: string
  inss: string
  fgts: string
  pis: string
  totalEncargos: string
  beneficios: string
  valeTransporte: string
  alimentacao: string
  planoSaude: string
  seguroVida: string
  totalBeneficios: string
  provisoes: string
  feriasEncargos: string
  abono: string
  decimoEncargos: string
  fgtsMultaAdicional: string
  totalProvisoes: string
  mensal: string
  anual: string
  descartar: string
  salvar: string
}>

export type PessoalFormProps = Readonly<{
  labels: PessoalFormLabels
  initialSalarioCents: number
  initialMeses: readonly number[]
  monthAbbrevs: readonly string[]
  formatCents: (c: number) => string
  onDescartar: () => void
  onSalvar: (custoMensalCents: number, meses: readonly number[]) => void
}>

function TextField(
  props: Readonly<{ label: string; value: string; numeric?: boolean; onChange: (v: string) => void }>,
): ReactNode {
  return (
    <label className={field}>
      <span className={fieldLabel}>{props.label}</span>
      <input
        className={fieldInput}
        inputMode={props.numeric === true ? 'decimal' : undefined}
        value={props.value}
        onChange={(e) => {
          props.onChange(e.target.value)
        }}
      />
    </label>
  )
}

function DerivedField(props: Readonly<{ label: string; value: string }>): ReactNode {
  return (
    <label className={field}>
      <span className={fieldLabel}>{props.label}</span>
      <div className={derivedInput}>{props.value}</div>
    </label>
  )
}

function SelectField(
  props: Readonly<{
    label: string
    value: string
    options: readonly string[]
    onChange: (v: string) => void
  }>,
): ReactNode {
  return (
    <label className={field}>
      <span className={fieldLabel}>{props.label}</span>
      <select
        className={fieldInput}
        value={props.value}
        onChange={(e) => {
          props.onChange(e.target.value)
        }}
      >
        <option value="">Selecione…</option>
        {props.options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  )
}

export function PessoalForm(props: PessoalFormProps): ReactNode {
  const { labels: L, formatCents } = props
  const [form, setForm] = useState<PessoalFormState>(() =>
    emptyPessoalForm(props.initialSalarioCents, props.initialMeses),
  )
  const calc = computePessoal(form)
  const set =
    (k: keyof PessoalFormState) =>
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
        <span className={configSectionTitle}>{L.tipo}</span>
        <div className={row2}>
          <SelectField
            label={L.nivel}
            value={form.nivel}
            options={['Superior Completo / Incompleto', 'Médio', 'Fundamental']}
            onChange={set('nivel')}
          />
          <SelectField
            label={L.vinculo}
            value={form.vinculo}
            options={['CLT', 'PJ', 'Estágio', 'Menor Aprendiz']}
            onChange={set('vinculo')}
          />
        </div>
      </div>

      <div className={configSection}>
        <span className={configSectionTitle}>{L.remuneracao}</span>
        <div className={row2}>
          <TextField label={L.qtd} value={form.qtd} numeric onChange={set('qtd')} />
          <TextField label={L.salario} value={form.salario} numeric onChange={set('salario')} />
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
        <div className={row2}>
          <TextField label={L.reajuste} value={form.reajuste} numeric onChange={set('reajuste')} />
          <DerivedField label={L.salarioTotal} value={formatCents(calc.salarioTotalCents)} />
        </div>
      </div>

      <div className={configSection}>
        <span className={configSectionTitle}>{L.encargos}</span>
        <div className={row3}>
          <TextField
            label={L.inssPatronal}
            value={form.inssPatronal}
            numeric
            onChange={set('inssPatronal')}
          />
          <TextField label={L.inss} value={form.inss} numeric onChange={set('inss')} />
          <TextField label={L.fgts} value={form.fgts} numeric onChange={set('fgts')} />
        </div>
        <div className={row2}>
          <TextField label={L.pis} value={form.pis} numeric onChange={set('pis')} />
          <DerivedField label={L.totalEncargos} value={formatCents(calc.totalEncargosCents)} />
        </div>
      </div>

      <div className={configSection}>
        <span className={configSectionTitle}>{L.beneficios}</span>
        <div className={row3}>
          <TextField
            label={L.valeTransporte}
            value={form.valeTransporte}
            numeric
            onChange={set('valeTransporte')}
          />
          <TextField label={L.alimentacao} value={form.alimentacao} numeric onChange={set('alimentacao')} />
          <TextField label={L.planoSaude} value={form.planoSaude} numeric onChange={set('planoSaude')} />
        </div>
        <div className={row2}>
          <TextField label={L.seguroVida} value={form.seguroVida} numeric onChange={set('seguroVida')} />
          <DerivedField label={L.totalBeneficios} value={formatCents(calc.totalBeneficiosCents)} />
        </div>
      </div>

      <div className={configSection}>
        <span className={configSectionTitle}>{L.provisoes}</span>
        <div className={row3}>
          <TextField
            label={L.feriasEncargos}
            value={form.feriasEncargos}
            numeric
            onChange={set('feriasEncargos')}
          />
          <TextField label={L.abono} value={form.abono} numeric onChange={set('abono')} />
          <TextField
            label={L.decimoEncargos}
            value={form.decimoEncargos}
            numeric
            onChange={set('decimoEncargos')}
          />
        </div>
        <div className={row2}>
          <TextField
            label={L.fgtsMultaAdicional}
            value={form.fgtsMultaAdicional}
            numeric
            onChange={set('fgtsMultaAdicional')}
          />
          <DerivedField label={L.totalProvisoes} value={formatCents(calc.totalProvisoesCents)} />
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
