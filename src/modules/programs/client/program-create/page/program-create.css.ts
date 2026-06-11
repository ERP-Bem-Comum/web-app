import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const screen = style({
  boxSizing: 'border-box',
  blockSize: '100%',
  overflowY: 'auto',
  padding: vars.space.xl,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
  scrollbarWidth: 'thin',
  scrollbarColor: `${vars.color.border.default} transparent`,
})

export const headerRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
})

export const backButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '2.5rem',
  blockSize: '2.5rem',
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.brand.normal}`,
  background: vars.color.surface.default,
  color: vars.color.brand.normal,
  cursor: 'pointer',
  selectors: {
    '&:hover': { background: vars.color.surface.subtle },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const headerTitle = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.xl,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
})

export const footer = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: vars.space.md,
})

export const cancelButton = style({
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

export const saveWrap = style({
  inlineSize: '10rem',
})

export const errorBanner = style({
  padding: vars.space.md,
  borderRadius: vars.radius.md,
  background: vars.color.feedback.errorBg,
  color: vars.color.feedback.errorText,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
})
