import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const screen = style({
  boxSizing: 'border-box',
  blockSize: '100%',
  overflowY: 'auto', // o form (pré-cadastro + território + banco/PIX) passa da dobra → rola
  padding: vars.space.xl,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
  // scrollbar discreta (mesmo padrão do detalhe)
  scrollbarWidth: 'thin',
  scrollbarColor: `${vars.color.border.default} transparent`,
})
