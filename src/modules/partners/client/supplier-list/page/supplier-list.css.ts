import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const screen = style({
  padding: vars.space.xl,
  display: 'flex',
  flexDirection: 'column',
})

export const newButtonWrap = style({
  inlineSize: 'auto',
})

// CNPJ formatado (18 chars) não pode quebrar no '-' / '/': cabe inteiro na coluna.
export const cnpjCell = style({
  whiteSpace: 'nowrap',
})
