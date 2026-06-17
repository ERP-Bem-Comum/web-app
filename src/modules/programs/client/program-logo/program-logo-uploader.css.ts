import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const wrap = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
})

const BOX = '4rem'

export const img = style({
  inlineSize: BOX,
  blockSize: BOX,
  borderRadius: vars.radius.lg,
  objectFit: 'cover',
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
})

export const placeholder = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: BOX,
  blockSize: BOX,
  borderRadius: vars.radius.lg,
  background: vars.color.surface.subtle,
  color: vars.color.text.muted,
})

export const info = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  alignItems: 'flex-start',
})

export const uploadBtn = style({
  display: 'inline-flex',
  alignItems: 'center',
  paddingBlock: vars.space.xs,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.secondary,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  cursor: 'pointer',
  ':hover': { background: vars.color.surface.subtle },
})

export const hint = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  color: vars.color.text.muted,
})

export const errorText = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  color: vars.color.status.terminatedText,
})
