import type { ReactNode } from 'react'

import { field, label, errorText } from './field.css.ts'

/**
 * Field (molécula) — estrutural: empilha <label> + controle (children) + erro.
 * BURRA: recebe o controle por `children` (composição — não importa Input, mantendo
 * acoplamento baixo). Com `error` → mensagem com role="alert"; sem `error` → nada
 * (não reserva espaço). O `label` é resolvido por fora (i18n).
 */
export type FieldProps = Readonly<{
  htmlFor: string
  label: string
  error?: string
  children: ReactNode
}>

export function Field(props: FieldProps): ReactNode {
  return (
    <div className={field}>
      <label htmlFor={props.htmlFor} className={label}>
        {props.label}
      </label>
      {props.children}
      {props.error ? (
        <span role="alert" className={errorText}>
          {props.error}
        </span>
      ) : null}
    </div>
  )
}
