import { style, globalStyle } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { scrollableY } from '#shared/ui/scroll.css.ts'

export const screen = style([
  scrollableY,
  {
    padding: vars.space.xl,
    display: 'flex',
    flexDirection: 'column',
  },
])

// Filhos não encolhem (senão a tabela é espremida ao invés de o container rolar).
globalStyle(`${screen} > *`, { flexShrink: 0 })
