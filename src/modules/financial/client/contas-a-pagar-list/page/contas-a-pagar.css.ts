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
// Ação primária — espelha `newButton` do grid de Contratos (azul sólido + texto em superfície).
export const newButton = style({
  marginInlineStart: 'auto',
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.sm,
  textDecoration: 'none',
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  fontFamily: vars.font.family.body,
  color: vars.color.surface.default,
  background: vars.color.institutional.blue,
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  ':hover': { background: vars.color.institutional.blueDeep },
})

export const chips = style({ display: 'flex', gap: vars.space.xs, flexWrap: 'wrap' })
// Chip de status (chrome) — denso como o mock (.chip: 11px, weight 500, radius 4px, ink-4).
export const chip = style({
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.medium,
  color: vars.color.institutional.ink4,
  background: vars.color.surface.default,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  paddingBlock: vars.space.xs,
  paddingInline: vars.space.sm,
  borderRadius: vars.radius.sm,
})
export const chipActive = style([
  chip,
  {
    color: vars.color.institutional.blueDeep,
    background: vars.color.institutional.blueBg,
    borderColor: vars.color.institutional.blueLine,
  },
])

// Grid de 6 colunas (DTO fino) com as LARGURAS EXATAS do Figma 205-638 (px→rem): Tipo 65 · Documento 100
// · Fornecedor flex(446) · Vencimento 105 · Líquido 110(→) · Status 130. (Colunas gated do Figma —
// checkbox/Contrato/Forma Pag./Emissão/Bruto — entram com o FIN-LIST-DTO #47.)
const GRID_COLS = '4.0625rem 6.25rem 1fr 6.5625rem 6.875rem 8.125rem'

export const grid = style({
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.lg,
  overflow: 'hidden',
  background: vars.color.surface.default,
})
export const head = style({
  display: 'grid',
  gridTemplateColumns: GRID_COLS,
  gap: '0.75rem', // Figma: gap 12px
  alignItems: 'center',
  minBlockSize: '2.25rem', // Figma: grid-head 36px
  paddingInline: vars.space.lg, // Figma: 24px lateral
  background: vars.color.institutional.paperWarm,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
})
// Cabeçalho denso (Figma "Badge" 9px): caixa-alta, peso bold, tracking largo, tom ink-5.
export const headCell = style({
  fontSize: vars.font.size['2xs'],
  fontWeight: vars.font.weight.bold,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: vars.color.institutional.ink5,
})
export const headCellRight = style([headCell, { textAlign: 'right' }])

export const row = style({
  display: 'grid',
  gridTemplateColumns: GRID_COLS,
  gap: '0.75rem', // Figma: gap 12px
  alignItems: 'center',
  minBlockSize: '3.5rem', // Figma: grid-row 56px
  paddingInline: vars.space.lg, // Figma: 24px lateral
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  fontSize: vars.font.size.xs, // Figma Body/Medium ~12.5px
  color: vars.color.institutional.ink2,
  transition: 'background 120ms ease',
  ':hover': { background: vars.color.institutional.paperWarm },
  ':last-child': { borderBlockEnd: 'none' },
})
export const cell = style({ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })
export const cellMutedDoc = style([cell, { color: vars.color.institutional.ink4 }])
export const cellNet = style({ textAlign: 'right', fontFamily: vars.font.family.mono })

// Badge de status — Figma "Badge" 9px bold caixa-alta.
export const statusBadge = style({
  justifySelf: 'start',
  fontSize: vars.font.size['2xs'],
  fontWeight: vars.font.weight.bold,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
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
