import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const dialog = style({
  border: `${vars.borderWidth.thin} solid ${vars.color.brand.normal}`,
  inlineSize: '100%',
  maxInlineSize: '22rem',
  padding: vars.space.lg,
  borderRadius: vars.radius.lg,
  background: vars.color.surface.default,
  color: vars.color.text.primary,
  boxShadow: vars.shadow.cardElevated,
  textAlign: 'center',
  selectors: {
    '&[open]': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: vars.space.md,
    },
    '&::backdrop': { background: vars.color.institutional.overlay },
  },
})

export const iconWrap = style({
  display: 'inline-flex',
  color: vars.color.brand.normal,
})

export const message = style({
  margin: 0,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
})

export const actions = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
  inlineSize: '100%',
})

export const confirmButton = style({
  inlineSize: '100%',
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.lg,
  borderRadius: vars.radius.md,
  border: 'none',
  background: vars.color.brand.normal,
  color: vars.color.brand.onBrand,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  cursor: 'pointer',
  selectors: {
    '&:hover': { background: vars.color.brand.hover },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const cancelButton = style({
  inlineSize: '100%',
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.lg,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.primary,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  cursor: 'pointer',
  selectors: {
    '&:hover': { background: vars.color.surface.subtle },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})
