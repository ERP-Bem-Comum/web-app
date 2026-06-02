import { style } from '@vanilla-extract/css'
import { vars } from '#shared/ui/tokens/index.ts'

export const screen = style({
  padding: vars.space[6],
  maxWidth: '1000px',
  margin: '0 auto',
})
