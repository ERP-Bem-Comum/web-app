import type { ReactNode } from 'react'

import { input } from './input.css.ts'
import { formatMask, unmask, type InputMask } from './input.mask.ts'

/**
 * Input (átomo) — BURRO: props + JSX, sem estado. Campos text/email/password do login.
 * Erro exposto como `aria-invalid` (gancho a11y + testado); o .css.ts estiliza a borda.
 * Sem <label> interno — a molécula Field rotula e associa pelo `id`. Estilo via tokens.
 * `mask`: exibe o valor mascarado (CPF/CNPJ/telefone) e emite só os dígitos no onChange.
 */
export type InputProps = Readonly<{
  id: string
  type?: 'text' | 'email' | 'password' | 'date' | 'number'
  value: string
  onChange: (value: string) => void
  placeholder?: string
  invalid?: boolean
  autoComplete?: string
  /** Máscara de exibição (CPF/CNPJ/telefone). O onChange continua emitindo apenas dígitos. */
  mask?: InputMask
  /** Desabilita o campo (ex.: campo vital somente-leitura na edição, como CNPJ/CPF). */
  disabled?: boolean
}>

export function Input(props: InputProps): ReactNode {
  const invalid = props.invalid ?? false
  const display = props.mask !== undefined ? formatMask(props.mask, props.value) : props.value

  return (
    <input
      id={props.id}
      type={props.type ?? 'text'}
      className={input}
      value={display}
      placeholder={props.placeholder}
      autoComplete={props.autoComplete}
      aria-invalid={invalid || undefined}
      disabled={props.disabled}
      inputMode={props.mask !== undefined ? 'numeric' : undefined}
      onChange={(e) => {
        props.onChange(props.mask !== undefined ? unmask(e.target.value) : e.target.value)
      }}
    />
  )
}
