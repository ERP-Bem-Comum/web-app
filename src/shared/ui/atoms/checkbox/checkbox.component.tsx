import type { ReactNode } from 'react'

import { checkbox } from './checkbox.css.ts'

/**
 * Checkbox (átomo) — BURRO: input nativo type="checkbox", sem estado. Encaminha
 * `e.target.checked` (boolean). Estilo por token (accent-color); sem <label> interno
 * (a molécula Field rotula e associa pelo `id`).
 */
export type CheckboxProps = Readonly<{
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}>

export function Checkbox(props: CheckboxProps): ReactNode {
  const disabled = props.disabled ?? false

  return (
    <input
      type="checkbox"
      id={props.id}
      className={checkbox}
      checked={props.checked}
      disabled={disabled}
      onChange={(e) => {
        // honra `disabled` mesmo se um evento de change chegar (defesa; o atributo já bloqueia
        // no browser real, mas mantém o onChange sempre presente — sem warning de read-only).
        if (!disabled) {
          props.onChange(e.target.checked)
        }
      }}
    />
  )
}
