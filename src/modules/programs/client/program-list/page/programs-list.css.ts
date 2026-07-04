import { style, globalStyle } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { scrollableY } from '#shared/ui/scroll.css.ts'

export const screen = style([
  scrollableY,
  {
    boxSizing: 'border-box',
    padding: vars.space.xl,
    display: 'flex',
    flexDirection: 'column',
    gap: vars.space.lg,
  },
])

// Filhos não encolhem (senão a tabela é espremida ao invés de o container rolar).
globalStyle(`${screen} > *`, { flexShrink: 0 })

export const logoCell = style({
  display: 'flex',
  alignItems: 'center',
})

export const logoPlaceholder = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '2.75rem',
  blockSize: '2.75rem',
  borderRadius: '50%',
  background: vars.color.surface.subtle,
  color: vars.color.text.muted,
})

// Logo real do programa (data URL via BFF) — mesmo gabarito do placeholder.
export const logoImg = style({
  inlineSize: '2.75rem',
  blockSize: '2.75rem',
  borderRadius: '50%',
  objectFit: 'cover',
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
})
