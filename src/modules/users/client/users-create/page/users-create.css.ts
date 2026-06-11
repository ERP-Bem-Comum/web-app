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
