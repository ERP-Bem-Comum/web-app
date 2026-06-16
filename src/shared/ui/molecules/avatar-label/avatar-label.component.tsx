import type { ReactNode } from 'react'

import { wrap, avatar, avatarVariant, textCol, label, subtitle } from './avatar-label.css.ts'

export type AvatarVariant = keyof typeof avatarVariant

export type AvatarLabelProps = Readonly<{
  /** Iniciais já calculadas (use `initialsFrom`). */
  initials: string
  variant: AvatarVariant
  text: string
  /** Sublinha opcional (ex.: CNPJ) — quando presente, vira célula de duas linhas (padrão Contratos). */
  subtitle?: string | null
}>

/** Avatar circular com iniciais (cor por tipo) + rótulo truncado (+ sublinha opcional). Célula de grids. */
export function AvatarLabel({ initials, variant, text, subtitle: sub }: AvatarLabelProps): ReactNode {
  return (
    <div className={wrap}>
      <span className={`${avatar} ${avatarVariant[variant]}`} aria-hidden="true">
        {initials}
      </span>
      {sub !== undefined && sub !== null && sub !== '' ? (
        <span className={textCol}>
          <span className={label}>{text}</span>
          <span className={subtitle}>{sub}</span>
        </span>
      ) : (
        <span className={label}>{text}</span>
      )}
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
