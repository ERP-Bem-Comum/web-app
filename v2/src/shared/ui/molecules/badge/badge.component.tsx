import type { ReactNode } from 'react'
import { badge, type BadgeVariant } from './badge.css.ts'

export type BadgeProps = Readonly<{
  children: ReactNode
  variant: BadgeVariant
}>

export function Badge({ children, variant }: BadgeProps): ReactNode {
  return <span className={badge[variant]}>{children}</span>
}
