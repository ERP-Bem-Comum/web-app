import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

// Container full-height: o formulário "brand" (`brand-form.css.ts → page`) preenche a área, desenha o
// fundo cinza e cuida da rolagem + barra de ações fixa. Rota marcada em `fullBleedContent`.
export const screen = style({
  blockSize: '100%',
  display: 'flex',
  flexDirection: 'column',
  minBlockSize: 0,
})

export const errorBanner = style({
  padding: vars.space.md,
  borderRadius: vars.radius.md,
  background: vars.color.feedback.errorBg,
  color: vars.color.feedback.errorText,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  marginBlockEnd: vars.space.lg,
})
