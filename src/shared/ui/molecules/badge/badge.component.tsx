import type { ReactNode } from 'react'
import { badge, uppercaseText, sizeSm, type BadgeVariant } from './badge.css.ts'

export type BadgeProps = Readonly<{
  children: ReactNode
  variant: BadgeVariant
  /** Renderiza o texto em CAIXA ALTA (mantém a fonte da badge). Opt-in por uso. */
  uppercase?: boolean
  /** `'sm'` = badge mais compacta/suave (padding e peso menores). */
  size?: 'md' | 'sm'
}>

export function Badge({ children, variant, uppercase = false, size = 'md' }: BadgeProps): ReactNode {
  const className = [badge[variant], uppercase ? uppercaseText : '', size === 'sm' ? sizeSm : '']
    .filter((c) => c !== '')
    .join(' ')
  return <span className={className}>{children}</span>
}
