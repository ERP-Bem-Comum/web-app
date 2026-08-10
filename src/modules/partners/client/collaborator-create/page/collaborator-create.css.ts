import { style } from '@vanilla-extract/css'

// Container full-height: o próprio formulário "brand" (`brand-form.css.ts → page`) preenche a área,
// desenha o fundo cinza e cuida da rolagem + barra de ações fixa. Rota marcada em `fullBleedContent`.
export const screen = style({
  blockSize: '100%',
  display: 'flex',
  flexDirection: 'column',
  minBlockSize: 0,
})
