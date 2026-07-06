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
  position: 'relative', // âncora do tooltip de hover (posicionado inline)
  fontFamily: vars.font.family.body,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.md,
  minBlockSize: '9rem',
  justifyContent: 'center',
})

// ── Tooltip de hover (arco/legenda) — mesmo padrão dos gráficos do Realizado × Planejado ──
export const arcHover = style({ cursor: 'pointer' })

export const tooltip = style({
  position: 'absolute',
  transform: 'translate(-50%, -115%)',
  pointerEvents: 'none',
  zIndex: 2,
  background: vars.color.surface.default,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.md,
  boxShadow: vars.shadow.cardElevated,
  padding: vars.space.sm,
  minInlineSize: '10rem',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
})
export const tooltipTitle = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.xs,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
})
export const tooltipRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  fontSize: vars.font.size.sm,
})
export const tooltipVal = style({
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
  fontVariantNumeric: 'tabular-nums',
})
export const tooltipPct = style({
  marginInlineStart: 'auto',
  color: vars.color.text.muted,
  fontVariantNumeric: 'tabular-nums',
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

// % da fatia (empurrado para a direita) — é um donut "em %".
export const legendValue = style({
  marginInlineStart: 'auto',
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
  fontVariantNumeric: 'tabular-nums',
})
