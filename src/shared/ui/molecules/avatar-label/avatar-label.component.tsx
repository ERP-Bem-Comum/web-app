import type { ReactNode } from 'react'

import { wrap, avatar, avatarVariant, label } from './avatar-label.css.ts'

export type AvatarVariant = keyof typeof avatarVariant

export type AvatarLabelProps = Readonly<{
  /** Iniciais já calculadas (use `initialsFrom`). */
  initials: string
  variant: AvatarVariant
  text: string
}>

/** Avatar circular com iniciais (cor por tipo) + rótulo truncado. Célula de nome dos grids. */
export function AvatarLabel({ initials, variant, text }: AvatarLabelProps): ReactNode {
  return (
    <div className={wrap}>
      <span className={`${avatar} ${avatarVariant[variant]}`} aria-hidden="true">{initials}</span>
      <span className={label}>{text}</span>
    </div>
  )
}

/** Iniciais (até 2) de um nome para o avatar; '—' quando vazio. */
export function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '—'
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return `${first}${last}`
}
