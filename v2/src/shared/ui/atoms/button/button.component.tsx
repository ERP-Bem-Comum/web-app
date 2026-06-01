import type { ReactNode } from 'react'

import { buttonState, labelHidden, spinner, srOnly } from './button.css.ts'
import { resolveButtonState } from './button.variants.ts'

/**
 * Button (átomo) — BURRO: props + JSX, sem estado de negócio. Variante primária (ciano).
 * `loading || disabled` → atributo `disabled` e nenhum `onClick`. No `loading`: o texto é
 * ocultado (mantendo a largura), um spinner CSS aparece, e `loadingLabel` vira o nome acessível
 * (sr-only) — `aria-busy` anuncia o estado. Estilo 100% via tokens (`vars`) no button.css.ts.
 */
export type ButtonProps = Readonly<{
  children: ReactNode
  type?: 'button' | 'submit'
  variant?: 'primary'
  disabled?: boolean
  loading?: boolean
  loadingLabel?: string
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
      <span className={loading ? labelHidden : undefined}>{props.children}</span>
      {loading ? <span className={spinner} aria-hidden="true" /> : null}
      {loading && props.loadingLabel !== undefined ? (
        <span className={srOnly}>{props.loadingLabel}</span>
      ) : null}
    </button>
  )
}
