import type { ReactNode } from 'react'

import { input } from './input.css.ts'

/**
 * Input (átomo) — BURRO: props + JSX, sem estado. Campos text/email/password do login.
 * Erro exposto como `aria-invalid` (gancho a11y + testado); o .css.ts estiliza a borda.
 * Sem <label> interno — a molécula Field rotula e associa pelo `id`. Estilo via tokens.
 */
export type InputProps = Readonly<{
  id: string
  type?: 'text' | 'email' | 'password' | 'date' | 'number'
  value: string
  onChange: (value: string) => void
  placeholder?: string
  invalid?: boolean
  autoComplete?: string
}>

export function Input(props: InputProps): ReactNode {
  const invalid = props.invalid ?? false

  return (
    <input
      id={props.id}
      type={props.type ?? 'text'}
      className={input}
      value={props.value}
      placeholder={props.placeholder}
      autoComplete={props.autoComplete}
      aria-invalid={invalid || undefined}
      onChange={(e) => {
        props.onChange(e.target.value)
      }}
    />
  )
}
