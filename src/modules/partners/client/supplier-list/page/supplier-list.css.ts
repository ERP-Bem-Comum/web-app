import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const screen = style({
  padding: vars.space.xl,
  display: 'flex',
  flexDirection: 'column',
  // O shell (DynamicContainer) é altura-fixa + overflow:hidden; sem isto, a lista longa empurra o
  // paginador (footer) p/ fora da viewport SEM barra de rolagem. Preenche a área e rola o próprio
  // conteúdo → o footer fica sempre acessível.
  blockSize: '100%',
  overflowY: 'auto',
})

export const newButtonWrap = style({
  inlineSize: 'auto',
})

// CNPJ formatado (18 chars) não pode quebrar no '-' / '/': cabe inteiro na coluna.
export const cnpjCell = style({
  whiteSpace: 'nowrap',
})
