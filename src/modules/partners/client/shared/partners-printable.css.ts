import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const doc = style({
  display: 'none',
  '@media': {
    print: {
      display: 'block',
      padding: vars.space.xl,
      fontFamily: vars.font.family.body,
      color: vars.color.institutional.ink2,
    },
  },
})

export const docHeader = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  paddingBlockEnd: vars.space.md,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.institutional.ink2}`,
  marginBlockEnd: vars.space.lg,
})

export const title = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.bold,
  color: vars.color.institutional.ink2,
})

export const emitted = style({
  fontSize: vars.font.size.xs,
  color: vars.color.institutional.ink4,
})

export const table = style({
  inlineSize: '100%',
  borderCollapse: 'collapse',
  fontSize: vars.font.size.sm,
})

export const th = style({
  textAlign: 'left',
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.sm,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.institutional.ink3}`,
  fontFamily: vars.font.family.heading,
  fontWeight: vars.font.weight.bold,
})

export const td = style({
  paddingBlock: vars.space.xs,
  paddingInline: vars.space.sm,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.institutional.ink4}`,
  verticalAlign: 'top',
})

export const tdEmpty = style({
  paddingBlock: vars.space.lg,
  paddingInline: vars.space.sm,
  textAlign: 'center',
  color: vars.color.institutional.ink4,
})
