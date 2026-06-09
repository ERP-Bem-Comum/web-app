import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const screen = style({
  padding: vars.space.xl,
  display: 'flex',
  flexDirection: 'column',
})

export const panels = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)',
  gap: vars.space.lg,
  '@media': {
    'screen and (max-width: 48rem)': { gridTemplateColumns: '1fr' },
  },
})

export const panel = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  padding: vars.space.lg,
  borderRadius: vars.radius.lg,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  background: vars.color.surface.default,
})

export const panelHeader = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: vars.space.sm,
})

export const panelTitle = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
})

export const count = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.secondary,
})

export const message = style({
  paddingBlock: vars.space.lg,
  paddingInline: vars.space.md,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.muted,
})

export const errorBanner = style({
  padding: vars.space.md,
  marginBlockEnd: vars.space.md,
  borderRadius: vars.radius.md,
  background: vars.color.feedback.errorBg,
  color: vars.color.feedback.errorText,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
})
