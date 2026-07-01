/**
 * DonutChart — estilos (vanilla-extract, §X: só-tokens, zero hex/px cru). SVG centralizado com tamanho
 * máximo; estado vazio = nota discreta centralizada. Cores das fatias vêm por token na view.
 */
import { style, styleVariants } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

// Accent semântico → cor de token, como CLASSE (a view não importa tokens — §boundaries).
// `stroke` p/ o arco do donut; `background` p/ o swatch da legenda.
export const arcStroke = styleVariants({
  red: { stroke: vars.color.feedback.errorText },
  green: { stroke: vars.color.status.activeText },
  indigo: { stroke: vars.color.nav.background },
  orange: { stroke: vars.color.institutional.orange },
})

export const swatchColor = styleVariants({
  red: { background: vars.color.feedback.errorText },
  green: { background: vars.color.status.activeText },
  indigo: { background: vars.color.nav.background },
  orange: { background: vars.color.institutional.orange },
})

export const wrap = style({
  fontFamily: vars.font.family.body,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.md,
  minBlockSize: '9rem',
  justifyContent: 'center',
})

export const svgEl = style({
  inlineSize: '10rem',
  blockSize: 'auto',
  maxInlineSize: '100%',
})

export const empty = style({
  color: vars.color.text.muted,
  fontSize: vars.font.size.sm,
  textAlign: 'center',
  paddingBlock: vars.space.lg,
})

export const legend = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  listStyle: 'none',
  margin: 0,
  padding: 0,
  inlineSize: '100%',
})

export const legendItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
})

export const legendSwatch = style({
  flexShrink: 0,
  inlineSize: vars.space.md,
  blockSize: vars.space.md,
  borderRadius: vars.radius.sm,
})

export const legendLabel = style({
  color: vars.color.text.secondary,
})
