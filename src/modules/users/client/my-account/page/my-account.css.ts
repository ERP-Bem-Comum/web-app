import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

// Container full-height: o shell "brand" (`brand-form.css.ts → page`) preenche a área, desenha o fundo
// cinza e cuida da rolagem + barra de ações fixa. Rota marcada em `fullBleedContent`.
export const screen = style({
  blockSize: '100%',
  display: 'flex',
  flexDirection: 'column',
  minBlockSize: 0,
})

// Linha do avatar + identidade (nome/e-mail) no topo do card de dados.
export const avatarRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.lg,
  marginBlockEnd: vars.space.xl,
})

export const identity = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.125rem',
  minInlineSize: 0,
})

export const accountName = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.bold,
  color: vars.color.institutional.ink2,
})

export const accountEmail = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  color: vars.color.institutional.ink4,
})

// Mensagem de loading/error (estados não-ready).
export const stateMessage = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  color: vars.color.institutional.ink4,
})
