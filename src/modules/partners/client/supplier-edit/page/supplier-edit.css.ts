import { style } from '@vanilla-extract/css'

// Container full-height: o formulário "brand" (`brand-form.css.ts → page`) preenche a área, desenha o
// fundo cinza e cuida da rolagem + barra de ações fixa. Rota já está em `fullBleedContent`.
export const screen = style({
  blockSize: '100%',
  display: 'flex',
  flexDirection: 'column',
  minBlockSize: 0,
})
