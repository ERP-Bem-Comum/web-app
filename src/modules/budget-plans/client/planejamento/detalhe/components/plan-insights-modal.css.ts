/**
 * Estilos do modal de Insights do plano (feature 060) — comparativo ano atual × anteriores. Só tokens (§X).
 */
import { style, styleVariants } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const overlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 70,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: vars.space.lg,
  background: vars.color.institutional.overlay,
})

export const dialog = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  inlineSize: '100%',
  maxInlineSize: '32rem',
  padding: vars.space.lg,
  borderRadius: vars.radius.lg,
  background: vars.color.surface.default,
  boxShadow: vars.shadow.cardElevated,
})

export const headerRow = style({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: vars.space.md,
})

export const title = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.md,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
})

export const closeButton = style({
  border: 'none',
  background: 'transparent',
  color: vars.color.text.muted,
  fontSize: vars.font.size.lg,
  lineHeight: 1,
  cursor: 'pointer',
})

export const currentBlock = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  padding: vars.space.md,
  borderRadius: vars.radius.md,
  background: vars.color.surface.app,
})

export const currentLabel = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  color: vars.color.text.secondary,
})

export const currentValue = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
})

/** Subtítulo do §1.6 ("Use esses insights para planejar…") — texto de apoio, tom secundário. */
export const subtitle = style({
  margin: 0,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
})

/** Sparkline do Histórico (§1.6) — linha de tendência do Planejado ano a ano. Escala com o container. */
export const spark = style({
  inlineSize: '100%',
  blockSize: '2.5rem',
  display: 'block',
  overflow: 'visible', // os pontos das pontas encostam na borda do viewBox
})

export const sparkLine = style({
  fill: 'none',
  stroke: vars.color.brand.normal,
  strokeWidth: 1.5,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
  vectorEffect: 'non-scaling-stroke', // o viewBox estica em X; sem isto a linha engrossaria junto
})

export const sparkDot = style({
  fill: vars.color.brand.normal,
})

/** Card do ano (§1.6): Planejado · Realizado · Média por rede — 3 métricas lado a lado. */
export const metricsRow = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: vars.space.md,
  padding: vars.space.md,
  borderRadius: vars.radius.md,
  background: vars.color.surface.app,
})

export const metric = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  minInlineSize: 0,
})

/** Nota de origem do "Realizado" (§1.6) — a P.O. definiu a fonte; a tela não deve deixar dúvida. */
export const sourceNote = style({
  margin: 0,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  color: vars.color.text.muted,
})

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
})

export const row = style({
  display: 'grid',
  gridTemplateColumns: '4rem 1fr auto',
  alignItems: 'center',
  gap: vars.space.md,
  paddingBlock: vars.space.sm,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
})

export const rowYear = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.secondary,
})

export const rowTotal = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
})

const deltaBase = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  textAlign: 'end',
})

export const delta = styleVariants({
  up: [deltaBase, { color: vars.color.brand.normal }],
  down: [deltaBase, { color: vars.color.feedback.errorText }],
  flat: [deltaBase, { color: vars.color.text.muted }],
})

export const stateText = style({
  margin: 0,
  paddingBlock: vars.space.lg,
  textAlign: 'center',
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
})

export const emptyText = style({
  margin: 0,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.muted,
})
