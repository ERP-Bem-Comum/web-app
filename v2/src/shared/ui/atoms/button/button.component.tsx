import type { ReactNode } from 'react'

import { buttonState } from './button.css.ts'
import { resolveButtonState } from './button.variants.ts'

/**
 * Button (átomo) — BURRO: props + JSX, sem estado de negócio. Variante primária (ciano).
 * `loading || disabled` → atributo `disabled` e nenhum `onClick` (I1: loading não troca texto).
 * Estilo 100% via tokens (`vars`) no button.css.ts.
 */
export type ButtonProps = Readonly<{
  children: ReactNode
  type?: 'button' | 'submit'
  variant?: 'primary'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
}>

export function Button(props: ButtonProps): ReactNode {
  const disabled = props.disabled ?? false
  const loading = props.loading ?? false
  const isInert = disabled || loading
  const state = resolveButtonState(disabled, loading)

  return (
    <button
      type={props.type ?? 'button'}
      className={buttonState[state]}
      disabled={isInert}
      aria-busy={loading || undefined}
      onClick={isInert ? undefined : props.onClick}
    >
      {props.children}
    </button>
  )
}
