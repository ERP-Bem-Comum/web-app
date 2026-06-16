/**
 * Contas a Pagar (grid) — estilos (vanilla-extract, só-tokens §X). Paleta DS v1 institucional (mesma do
 * Lançar Documento/Contratos): `institutional.*`, `status.*`, `font.family.mono` nos valores. Layout do
 * mock (grid-contas-a-pagar): topbar + chips (chrome) + grid de 6 colunas (DTO fino) + paginação.
 */
import { style, styleVariants } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const screen = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
  inlineSize: '100%',
})

export const topbar = style({ display: 'flex', alignItems: 'center', gap: vars.space.md })
export const topTitle = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.lg,
  color: vars.color.text.primary,
})
export const count = style({
  fontSize: vars.font.size.sm,
  color: vars.color.institutional.blueDeep,
  background: vars.color.institutional.blueBg,
  paddingBlock: vars.space.xs,
  paddingInline: vars.space.sm,
  borderRadius: vars.radius.xl,
})
export const newButton = style({
  marginInlineStart: 'auto',
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  textDecoration: 'none',
  fontSize: vars.font.size.sm,
  fontWeight: 600,
  color: vars.color.institutional.paperWarm,
  background: vars.color.institutional.blueDeep,
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
})

export const chips = style({ display: 'flex', gap: vars.space.xs, flexWrap: 'wrap' })
export const chip = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
  background: vars.color.surface.default,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  paddingBlock: vars.space.xs,
  paddingInline: vars.space.sm,
  borderRadius: vars.radius.xl,
})
export const chipActive = style([
  chip,
  {
    color: vars.color.institutional.blueDeep,
    background: vars.color.institutional.blueBg,
    borderColor: vars.color.institutional.blueLine,
  },
])

// Grid de 6 colunas (DTO fino): Tipo · Documento · Fornecedor · Vencimento · Líquido(→) · Status.
const GRID_COLS = '7rem 9rem 1fr 8rem 9rem 7rem'

export const grid = style({
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.lg,
  overflow: 'hidden',
  background: vars.color.surface.default,
})
export const head = style({
  display: 'grid',
  gridTemplateColumns: GRID_COLS,
  gap: vars.space.sm,
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.md,
  background: vars.color.institutional.paperWarm,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
})
export const headCell = style({
  fontSize: vars.font.size.xs,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: vars.color.text.muted,
})
export const headCellRight = style([headCell, { textAlign: 'right' }])

export const row = style({
  display: 'grid',
  gridTemplateColumns: GRID_COLS,
  gap: vars.space.sm,
  alignItems: 'center',
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.md,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
  ':last-child': { borderBlockEnd: 'none' },
})
export const cell = style({ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })
export const cellMutedDoc = style([cell, { color: vars.color.text.secondary }])
export const cellNet = style({ textAlign: 'right', fontFamily: vars.font.family.mono })

export const statusBadge = style({
  justifySelf: 'start',
  fontSize: vars.font.size.xs,
  fontWeight: 600,
  paddingBlock: vars.space.xs,
  paddingInline: vars.space.sm,
  borderRadius: vars.radius.xl,
})
export const statusVariant = styleVariants({
  Rascunho: { background: vars.color.status.cancelledBg, color: vars.color.status.cancelledText },
  Aberto: { background: vars.color.status.pendingBg, color: vars.color.status.pendingText },
  Aprovado: { background: vars.color.status.activeBg, color: vars.color.status.activeText },
  Transmitido: { background: vars.color.status.finishedBg, color: vars.color.status.finishedText },
  Recusado: { background: vars.color.status.terminatedBg, color: vars.color.status.terminatedText },
  Pago: { background: vars.color.status.activeBg, color: vars.color.status.activeText },
  Conciliado: { background: vars.color.status.finishedBg, color: vars.color.status.finishedText },
})

export const placeholder = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.xs,
  paddingBlock: vars.space.xl,
  paddingInline: vars.space.lg,
  color: vars.color.text.muted,
  fontSize: vars.font.size.sm,
  textAlign: 'center',
})
export const placeholderTitle = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.md,
  color: vars.color.text.secondary,
})
export const errorBanner = style({
  paddingBlock: vars.space.md,
  paddingInline: vars.space.lg,
  background: vars.color.feedback.errorBg,
  color: vars.color.feedback.errorText,
  fontSize: vars.font.size.sm,
  textAlign: 'center',
})

export const pagination = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  fontSize: vars.font.size.sm,
  color: vars.color.text.muted,
})
export const pageRange = style({ marginInlineEnd: 'auto' })
export const pageNav = style({ display: 'flex', gap: vars.space.xs })
export const pageBtn = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '2rem',
  blockSize: '2rem',
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  borderRadius: vars.radius.md,
  background: vars.color.surface.default,
  color: vars.color.text.secondary,
  cursor: 'pointer',
  ':disabled': { opacity: 0.4, cursor: 'not-allowed' },
})
