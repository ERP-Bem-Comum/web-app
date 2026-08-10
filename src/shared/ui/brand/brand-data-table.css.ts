/**
 * Estilos do BrandDataTable (identidade de grid "brand") — cartão, thead uppercase, linhas com hover,
 * avatar (cor por grid, via inline style), chips de status e estados loading/erro/vazio. O número de colunas
 * e as proporções vêm por `gridTemplateColumns` INLINE (cada grid passa o seu). Consome `brand` + `vars`.
 */
import { style, styleVariants } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

import { brand } from './grid-brand.values.ts'

export const card = style({
  background: brand.color.surface,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  borderRadius: brand.radius.lg,
  boxShadow: brand.shadow.card,
  overflow: 'hidden',
  fontFamily: vars.font.family.heading, // Inter
  color: brand.color.ink700,
  fontSize: brand.text.body,
})

// Base grid (thead + linhas). `gridTemplateColumns` é aplicado INLINE por cada grid.
const gridRow = style({ display: 'grid', alignItems: 'center' })

export const thead = style([
  gridRow,
  {
    background: brand.color.surfaceAlt,
    borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line}`,
    paddingBlock: brand.size.theadPadBlock,
    paddingInline: brand.size.rowPadInline,
    fontSize: brand.text.thead,
    fontWeight: brand.weight.semibold,
    letterSpacing: '.03em',
    textTransform: 'uppercase',
    color: brand.color.ink500,
  },
])

export const row = style([
  gridRow,
  {
    paddingBlock: brand.size.rowPadBlock,
    paddingInline: brand.size.rowPadInline,
    borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line2}`,
    transition: `background ${brand.ease}`,
    selectors: { '&:last-child': { borderBlockEnd: 'none' } },
  },
])

export const rowClickable = style({
  cursor: 'pointer',
  selectors: {
    '&:hover': { background: brand.color.rowHover },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: `calc(-1 * ${vars.focusRing.width})`,
    },
  },
})

export const cell = style({
  minInlineSize: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})
export const muted = style([cell, { color: brand.color.ink500 }])
export const numZero = style({ color: brand.color.zeroNum })

// Coluna com avatar + nome.
export const personCell = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.md,
  minInlineSize: 0,
})
export const nameText = style([cell, { fontWeight: brand.weight.semibold, color: brand.color.ink900 }])

// Avatar (círculo) — cor (background/color) vem por INLINE style de cada grid; logo real (Programas)
// usa `avatarLogo`.
export const avatar = style({
  inlineSize: brand.size.avatar,
  blockSize: brand.size.avatar,
  flexShrink: 0,
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  fontSize: brand.text.avatar,
  fontWeight: brand.weight.bold,
  textTransform: 'uppercase',
})
export const avatarLogo = style({
  inlineSize: brand.size.avatar,
  blockSize: brand.size.avatar,
  flexShrink: 0,
  borderRadius: '50%',
  objectFit: 'cover',
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
})
export const avatarPlaceholder = style([
  avatar,
  { background: brand.color.surfaceAlt, color: brand.color.ink400 },
])

// Estados (loading/empty/error) — largura toda.
export const stateRow = style({
  paddingBlock: brand.space.xxl,
  paddingInline: brand.size.rowPadInline,
  textAlign: 'center',
  color: brand.color.ink500,
})
export const errorRow = style([stateRow, { color: brand.color.dangerFg }])

// ── Chips (pill) ──
export const chip = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: brand.space.xs,
  paddingBlock: brand.size.chipPadBlock,
  paddingInlineStart: brand.size.chipPadStart,
  paddingInlineEnd: brand.size.chipPadEnd,
  borderRadius: brand.radius.pill,
  fontSize: brand.text.chip,
  fontWeight: brand.weight.semibold,
  letterSpacing: '.02em',
  whiteSpace: 'nowrap',
})
export const dot = style({ inlineSize: brand.size.dot, blockSize: brand.size.dot, borderRadius: '50%' })

export const chipTone = styleVariants({
  ok: { background: brand.color.okBg, color: brand.color.okFg },
  danger: { background: brand.color.dangerBg, color: brand.color.dangerFg },
  cad: { background: brand.color.cadBg, color: brand.color.cadFg },
  warn: { background: brand.color.warnBg, color: brand.color.warnFg },
})
export const dotTone = styleVariants({
  ok: { background: brand.color.okDot },
  danger: { background: brand.color.dangerDot },
  cad: { background: brand.color.cadDot },
  warn: { background: brand.color.warnDot },
})
