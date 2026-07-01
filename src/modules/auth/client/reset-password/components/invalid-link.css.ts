import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const content = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
})

export const header = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: vars.space.sm,
})

export const title = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.xl,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
  margin: 0,
})

export const titleUnderline = style({
  display: 'block',
  inlineSize: '2.5rem',
  blockSize: '0.1875rem',
  background: vars.color.institutional.orange,
  borderRadius: vars.radius.sm,
  marginInline: 'auto',
})

export const message = style({
  margin: 0,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
})

export const ctaWrap = style({
  paddingInline: vars.space.lg,
})
