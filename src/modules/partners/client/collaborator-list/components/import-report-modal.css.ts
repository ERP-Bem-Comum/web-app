import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const dialog = style({
  border: 'none',
  inlineSize: '100%',
  maxInlineSize: '32rem',
  padding: vars.space.lg,
  borderRadius: vars.radius.lg,
  background: vars.color.surface.default,
  color: vars.color.text.primary,
  boxShadow: vars.shadow.cardElevated,
  selectors: {
    '&[open]': { display: 'flex', flexDirection: 'column', gap: vars.space.md },
    '&::backdrop': { background: vars.color.institutional.overlay },
  },
})

export const title = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
})

export const summary = style({
  margin: 0,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
})

export const failList = style({
  margin: 0,
  paddingInlineStart: vars.space.lg,
  maxBlockSize: '14rem',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
})

export const failItem = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  color: vars.color.feedback.errorText,
})

export const actions = style({
  display: 'flex',
  justifyContent: 'flex-end',
})

export const closeButton = style({
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
