/**
 * Card de coluna de territórios — identidade "brand" (mock estados-municipios-brand): card com header de
 * ícone tintado + título + meta, corpo com busca (ícone), rótulo de coluna, lista rolável e linhas com
 * botão de ação circular (verde adicionar / vermelho remover). px/hex crus ficam nas *.values.ts.
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

import { geography } from '../geography.values.ts'

export const card = style({
  display: 'flex',
  flexDirection: 'column',
  background: brand.color.surface,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  borderRadius: brand.radius.lg,
  boxShadow: brand.shadow.card,
  overflow: 'hidden',
  fontFamily: vars.font.family.heading, // Inter
  minBlockSize: 0,
})

// Faixa de título: ícone tintado + título + meta à direita, sobre surface-alt.
export const header = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.md,
  paddingBlock: brand.space.lg,
  paddingInline: brand.space.xl,
  background: brand.color.surfaceAlt,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line2}`,
})

export const ic = style({
  display: 'grid',
  placeItems: 'center',
  inlineSize: brand.size.sectionIconBox,
  blockSize: brand.size.sectionIconBox,
  flex: 'none',
  borderRadius: brand.radius.iconSm,
  background: brand.color.cadBg,
  color: brand.color.primary,
})

export const title = style({
  margin: 0,
  fontSize: brand.text.sectionH2,
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
})

export const count = style({
  marginInlineStart: 'auto',
  fontSize: brand.text.dd,
  fontWeight: brand.weight.semibold,
  color: brand.color.ink500,
  fontVariantNumeric: 'tabular-nums',
})

// Corpo do card (padding do mock: ~18/20/20).
export const body = style({
  paddingBlock: `${brand.space.lg} ${brand.space.xl}`,
  paddingInline: brand.space.xl,
})

// Busca com ícone à esquerda.
export const search = style({
  position: 'relative',
  marginBlockEnd: brand.space.xs,
})

export const searchIcon = style({
  position: 'absolute',
  insetInlineStart: brand.space.lg,
  insetBlockStart: '50%',
  transform: 'translateY(-50%)',
  color: brand.color.ink400,
  display: 'grid',
  placeItems: 'center',
  pointerEvents: 'none',
})

export const searchInput = style({
  inlineSize: '100%',
  blockSize: brand.size.searchH,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  borderRadius: brand.radius.sm,
  background: brand.color.surface,
  paddingInline: `${brand.size.searchPadStart} ${brand.space.lg}`,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.body,
  color: brand.color.ink700,
  boxSizing: 'border-box',
  transition: `border-color ${brand.ease}, box-shadow ${brand.ease}`,
  selectors: {
    '&::placeholder': { color: brand.color.ink400 },
    '&:focus': {
      outline: 'none',
      borderColor: brand.color.primary,
      boxShadow: brand.shadow.focus,
    },
  },
})

// Rótulo de coluna (ex.: "Estados" · "Adicionar").
export const tableHead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingBlock: `${brand.space.lg} ${brand.space.sm}`,
  paddingInline: brand.space.xxs,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  fontSize: brand.text.thead,
  fontWeight: brand.weight.bold,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: brand.color.ink500,
})

export const list = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  maxBlockSize: '21.25rem', // 340px (mock)
  overflowY: 'auto',
  scrollbarWidth: 'thin',
  scrollbarColor: `${brand.color.scrollThumb} transparent`,
  selectors: {
    '&::-webkit-scrollbar': { inlineSize: '0.5rem' },
    '&::-webkit-scrollbar-thumb': { background: brand.color.scrollThumb, borderRadius: brand.radius.sm },
    '&::-webkit-scrollbar-track': { background: 'transparent' },
  },
})

export const row = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: brand.space.md,
  paddingBlock: brand.space.md,
  paddingInline: brand.space.sm,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line2}`,
  borderRadius: brand.radius.sm,
  transition: `background ${brand.ease}`,
  selectors: {
    '&:last-child': { borderBlockEnd: 'none' },
    '&:hover': { background: brand.color.rowHover },
  },
})

export const label = style({
  fontSize: brand.text.body,
  fontWeight: brand.weight.medium,
  color: brand.color.ink700,
})

export const addedText = style({
  fontSize: brand.text.dd,
  fontWeight: brand.weight.semibold,
  color: brand.color.okFg,
})

const actionBase = style({
  display: 'grid',
  placeItems: 'center',
  inlineSize: '1.875rem', // 30px (mock)
  blockSize: '1.875rem',
  flexShrink: 0,
  borderRadius: brand.radius.pill,
  background: brand.color.surface,
  cursor: 'pointer',
  transition: `background ${brand.ease}, color ${brand.ease}`,
  selectors: {
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
    '&:disabled': { opacity: '0.5', cursor: 'not-allowed' },
  },
  '@media': { '(prefers-reduced-motion: reduce)': { transition: 'none' } },
})

export const addButton = style([
  actionBase,
  {
    border: `${vars.borderWidth.thick} solid ${geography.addGreen}`,
    color: geography.addGreen,
    selectors: {
      '&:hover:not(:disabled)': { background: geography.addGreen, color: brand.color.surface },
    },
  },
])

export const removeButton = style([
  actionBase,
  {
    border: `${vars.borderWidth.thick} solid ${geography.removeRed}`,
    color: geography.removeRed,
    selectors: {
      '&:hover:not(:disabled)': { background: geography.removeRed, color: brand.color.surface },
    },
  },
])

export const message = style({
  paddingBlock: brand.space.xxl,
  paddingInline: brand.space.sm,
  textAlign: 'center',
  fontSize: brand.text.dd,
  color: brand.color.ink400,
})
