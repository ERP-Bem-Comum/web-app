import { style } from '@vanilla-extract/css'

import { vars } from '../../tokens/index.ts'

/**
 * Estilos do PageHeader — vanilla-extract, SÓ `vars.*`. Layout: título (+subtítulo) à esquerda,
 * slot de ações à direita; quebra para coluna em viewport estreito.
 */
export const header = style({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: vars.space.md,
  flexWrap: 'wrap',
  marginBlockEnd: vars.space.lg,
})

export const titleGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  minInlineSize: 0,
})

export const title = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.xl,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
  lineHeight: 1.2,
})

export const subtitle = style({
  margin: 0,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
})

export const actions = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  flexShrink: 0,
})
