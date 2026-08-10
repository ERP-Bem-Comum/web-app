/**
 * Toolbar da lista de Planejamento no padrão "brand" (mock `planejamento-brand`): botão-ícone de filtro
 * quadrado (42px) + busca ocupando o resto (input 42px com lupa à esquerda, foco azul) + botão primário
 * "Criar plano". O funil expande o painel Ano/Programa/Status + Filtrar/Limpar (funcionalidade preservada).
 * Cores/px fora do kit vivem em `planejamento.values.ts`; o resto vem de `brand`/`vars`. Só tokens (§X).
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

import { planejamento } from '../planejamento.values.ts'

export const toolbar = style({
  display: 'flex',
  flexDirection: 'column',
  gap: brand.space.md,
  fontFamily: vars.font.family.heading, // Inter
})

export const toolbarRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.md,
})

// Botão-ícone quadrado 42px (filtro).
const iconBtnBase = style({
  inlineSize: brand.size.field,
  blockSize: brand.size.field,
  flexShrink: 0,
  display: 'grid',
  placeItems: 'center',
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: brand.color.surface,
  borderRadius: brand.radius.sm,
  color: brand.color.ink500,
  cursor: 'pointer',
  transition: `all ${brand.ease}`,
  selectors: {
    '&:hover': { borderColor: brand.color.lineStrong, color: brand.color.ink700 },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})
export const funnelButton = style([iconBtnBase])
export const funnelButtonActive = style([
  iconBtnBase,
  {
    background: brand.color.primary,
    color: brand.color.surface,
    borderColor: brand.color.primary,
    selectors: { '&:hover': { background: brand.color.primaryHover, color: brand.color.surface } },
  },
])

// Busca: ocupa o resto; input 42px com lupa à esquerda.
export const searchWrap = style({
  position: 'relative',
  flex: 1,
  display: 'flex',
  alignItems: 'center',
})

export const searchIcon = style({
  position: 'absolute',
  insetInlineStart: planejamento.size.searchIconInset,
  display: 'inline-flex',
  color: brand.color.ink400,
  pointerEvents: 'none',
})

export const searchInput = style({
  inlineSize: '100%',
  blockSize: brand.size.field,
  paddingInlineStart: brand.size.searchPadStart,
  paddingInlineEnd: brand.space.lg,
  borderRadius: brand.radius.sm,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: brand.color.surface,
  color: brand.color.ink700,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.body,
  transition: `all ${brand.ease}`,
  selectors: {
    '&::placeholder': { color: brand.color.ink400 },
    '&:focus': {
      outline: 'none',
      borderColor: brand.color.primary,
      boxShadow: planejamento.searchFocusRing,
    },
  },
})

export const spacer = style({ display: 'none' })

// Botão primário "Criar plano" (42px, azul da marca).
export const createButton = style({
  blockSize: brand.size.field,
  paddingInline: planejamento.size.createPadInline,
  borderRadius: brand.radius.sm,
  border: 'none',
  background: brand.color.primary,
  color: brand.color.surface,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.body,
  fontWeight: brand.weight.semibold,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  boxShadow: brand.shadow.btn,
  transition: `background ${brand.ease}`,
  selectors: {
    '&:hover': { background: brand.color.primaryHover },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

// ── Painel expansível do funil (Ano/Programa/Status + Filtrar/Limpar) ──
export const panel = style({
  display: 'flex',
  flexDirection: 'column',
  gap: brand.space.md,
  padding: brand.space.lg,
  borderRadius: brand.radius.md,
  border: `${vars.borderWidth.thin} solid ${brand.color.panelBorder}`,
  background: brand.color.panelBg,
})

export const groupGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
  columnGap: brand.space.md,
  rowGap: brand.space.sm,
  alignItems: 'end',
  '@media': {
    '(min-width: 48rem)': { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' },
  },
})

export const fieldWrap = style({
  display: 'flex',
  flexDirection: 'column',
  gap: brand.space.xs,
  minInlineSize: 0,
})

export const fieldLabel = style({
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.label,
  fontWeight: brand.weight.semibold,
  color: brand.color.groupFg,
  whiteSpace: 'nowrap',
})

export const select = style({
  blockSize: brand.size.field,
  paddingInline: brand.space.md,
  borderRadius: brand.radius.sm,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: brand.color.surface,
  color: brand.color.ink700,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.dd,
  inlineSize: '100%',
})

export const panelFooter = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  flexWrap: 'wrap',
  gap: brand.space.sm,
  paddingBlockStart: brand.space.sm,
  borderBlockStart: `${vars.borderWidth.thin} solid ${brand.color.panelBorder}`,
})

const footerButtonBase = style({
  paddingBlock: brand.space.sm,
  paddingInline: brand.space.xl,
  borderRadius: brand.radius.sm,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.body,
  fontWeight: brand.weight.semibold,
  cursor: 'pointer',
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
})
export const applyButton = style([
  footerButtonBase,
  {
    background: brand.color.primary,
    color: brand.color.surface,
    borderColor: brand.color.primary,
    selectors: { '&:hover': { background: brand.color.primaryHover, borderColor: brand.color.primaryHover } },
  },
])
export const clearButton = style([
  footerButtonBase,
  {
    background: 'transparent',
    color: brand.color.ink500,
    selectors: { '&:hover': { background: brand.color.surface } },
  },
])
