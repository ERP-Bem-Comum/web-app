import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const overlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 100,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: vars.space.lg,
  background: vars.color.institutional.overlay,
})

export const content = style({
  inlineSize: '100%',
  maxInlineSize: '26rem',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  padding: vars.space.lg,
  borderRadius: vars.radius.lg,
  background: vars.color.surface.default,
  boxShadow: vars.shadow.cardElevated,
})

export const title = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.bold,
  color: vars.color.institutional.ink2,
})

export const label = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.institutional.ink3,
})

export const body = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  lineHeight: 1.5,
  color: vars.color.institutional.ink3,
})

export const aviso = style({
  padding: vars.space.md,
  borderRadius: vars.radius.md,
  background: vars.color.status.pendingBg,
  color: vars.color.status.pendingText,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  lineHeight: 1.5,
})

export const footer = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: vars.space.sm,
  marginBlockStart: vars.space.sm,
})

const buttonBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  blockSize: '2.25rem',
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  cursor: 'pointer',
  borderStyle: 'solid',
  borderWidth: vars.borderWidth.thin,
  selectors: {
    '&:disabled': { opacity: '0.5', cursor: 'not-allowed' },
  },
})

export const buttonSecondary = style([buttonBase, {
  background: vars.color.surface.default,
  borderColor: vars.color.border.default,
  color: vars.color.institutional.ink2,
  selectors: { '&:hover:not(:disabled)': { background: vars.color.institutional.paperWarm } },
}])

export const buttonDanger = style([buttonBase, {
  background: vars.color.feedback.errorText,
  borderColor: vars.color.feedback.errorText,
  color: vars.color.surface.default,
}])
