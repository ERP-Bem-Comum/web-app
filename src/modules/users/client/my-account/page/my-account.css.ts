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

export const card = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: vars.space.xl,
  padding: vars.space.lg,
  borderRadius: vars.radius.lg,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  background: vars.color.surface.default,
  boxShadow: vars.shadow.card,
})

export const avatar = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '7rem',
  blockSize: '7rem',
  flexShrink: 0,
  borderRadius: vars.radius.md,
  background: vars.color.surface.subtle,
  color: vars.color.text.secondary,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.semibold,
})

export const body = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
  flex: 1,
  minInlineSize: 0,
})

export const name = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.xl,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
})

export const infoRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
})

export const infoIcon = style({
  color: vars.color.brand.normal,
  flexShrink: 0,
  display: 'inline-flex',
})

export const actions = style({
  display: 'flex',
  gap: vars.space.sm,
  flexShrink: 0,
})

export const resetButton = style({
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
  whiteSpace: 'nowrap',
  transitionProperty: 'background-color',
  transitionDuration: '150ms',
  selectors: {
    '&:hover': { background: vars.color.surface.subtle },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
  '@media': {
    '(prefers-reduced-motion: reduce)': { transitionDuration: '0.01ms' },
  },
})

export const editWrap = style({
  inlineSize: '7rem',
})
