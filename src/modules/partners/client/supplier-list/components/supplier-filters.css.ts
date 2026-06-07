import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const toolbar = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: vars.space.sm,
  marginBlockEnd: vars.space.md,
})

export const search = style({
  flex: '1 1 16rem',
  minInlineSize: '12rem',
})

export const group = style({
  display: 'inline-flex',
  gap: vars.space.xs,
})

export const select = style({
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.primary,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
})

const chipBase = style({
  paddingBlock: vars.space.xs,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.secondary,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  cursor: 'pointer',
})

export const chip = style([chipBase])

export const chipActive = style([
  chipBase,
  {
    background: vars.color.brand.normal,
    color: vars.color.brand.onBrand,
    borderColor: vars.color.brand.normal,
  },
])
