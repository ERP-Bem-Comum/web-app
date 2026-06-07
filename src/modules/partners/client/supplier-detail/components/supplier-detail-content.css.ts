import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const layout = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
  gap: vars.space.lg,
  '@media': {
    'screen and (max-width: 48rem)': { gridTemplateColumns: '1fr' },
  },
})

export const card = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  padding: vars.space.lg,
  borderRadius: vars.radius.lg,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  background: vars.color.surface.default,
  // contexto para o `@container` do fieldGrid — o card já colapsa para 1 coluna no layout pai;
  // o container query reage à largura REAL do card, não do viewport.
  containerType: 'inline-size',
})

export const cardTitle = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
})

export const fieldGrid = style({
  display: 'grid',
  gridTemplateColumns: '1fr', // mobile-first: 1 coluna
  gap: vars.space.md,
  '@container': {
    '(inline-size > 28rem)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
  },
})

export const field = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
})

export const fieldLabel = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  color: vars.color.text.muted,
})

export const fieldValue = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
})
