/**
 * PlanSelector — view BURRA (§XI) do seletor de plano do gráfico "Realizado × Previsto" (specs/096 P3).
 * <select> nativo (acessível). Recebe as opções JÁ com o rótulo resolvido (o "Todos somados" é traduzido
 * no componente-pai) + o valor atual + o callback. Nada de fetch/estado aqui.
 */
import type { ReactNode } from 'react'

import { select } from './plan-selector.css.ts'

export type PlanSelectorOption = Readonly<{ value: string; label: string }>

export type PlanSelectorProps = Readonly<{
  ariaLabel: string
  value: string
  options: readonly PlanSelectorOption[]
  onChange: (value: string) => void
}>

export function PlanSelector(props: PlanSelectorProps): ReactNode {
  return (
    <select
      className={select}
      aria-label={props.ariaLabel}
      value={props.value}
      onChange={(e) => {
        props.onChange(e.currentTarget.value)
      }}
    >
      {props.options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
