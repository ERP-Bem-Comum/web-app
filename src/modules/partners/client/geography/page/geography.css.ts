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

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  flexShrink: 0,
})

export const columns = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: vars.space.lg,
  alignItems: 'start',
  '@media': {
    'screen and (max-width: 60rem)': { gridTemplateColumns: '1fr' },
  },
})

export const ufSelect = style({
  blockSize: '2.5rem',
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.primary,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  inlineSize: '100%',
})

export const errorBanner = style({
  padding: vars.space.md,
  borderRadius: vars.radius.md,
  background: vars.color.feedback.errorBg,
  color: vars.color.feedback.errorText,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
})
