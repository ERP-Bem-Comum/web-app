/**
 * `scrollableY` — util de container rolável na vertical com barra SEMPRE visível (o macOS auto-esconde a
 * nativa). Composta pelos `screen` das telas de lista. Requer que o shell limite a altura (`min-block-size:0`
 * em `main`/`content` do DynamicContainer) para o overflow existir. Cor do thumb = a mesma dos grids "brand".
 */
import { style } from '@vanilla-extract/css'

import { brand } from './brand/grid-brand.values.ts'

export const scrollableY = style({
  blockSize: '100%',
  overflowY: 'auto',
  scrollbarWidth: 'thin',
  scrollbarColor: `${brand.color.scrollThumb} transparent`,
  selectors: {
    '&::-webkit-scrollbar': { inlineSize: '0.625rem' },
    '&::-webkit-scrollbar-thumb': { background: brand.color.scrollThumb, borderRadius: brand.radius.sm },
    '&::-webkit-scrollbar-track': { background: 'transparent' },
  },
})
