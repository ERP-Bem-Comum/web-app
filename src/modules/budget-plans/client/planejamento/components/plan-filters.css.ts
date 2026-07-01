/**
 * Estilos da barra de filtros da lista de Planejamento (§1.1): funil + "Pesquise" + "Criar Plano"; o funil
 * expande a linha Ano/Programa/Status + "Filtrar". Espelha o modelo visual dos grids de parceiros (funil,
 * painel azul-claro, select, botão de aplicar) — reescrito no módulo (cross-módulo só via public-api).
 * Só tokens (§X).
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const toolbar = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
  marginBlockEnd: vars.space.md,
})

export const toolbarRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
})

export const search = style({
  flex: '1 1 16rem',
  minInlineSize: '12rem',
})

const funnelBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '2.5rem',
  blockSize: '2.5rem',
  flexShrink: 0,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.secondary,
  cursor: 'pointer',
  selectors: {
    '&:hover': { background: vars.color.surface.subtle },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})
export const funnelButton = style([funnelBase])
export const funnelButtonActive = style([
  funnelBase,
  {
    background: vars.color.brand.normal,
    color: vars.color.brand.onBrand,
    borderColor: vars.color.brand.normal,
  },
])

/** Campo de busca (input + ícone). */
export const searchWrap = style({
  position: 'relative',
  flex: '1 1 16rem',
  minInlineSize: '12rem',
  display: 'flex',
  alignItems: 'center',
})

export const searchInput = style({
  inlineSize: '100%',
  blockSize: '2.5rem',
  paddingInlineStart: '2.5rem',
  paddingInlineEnd: vars.space.md,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.primary,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  selectors: {
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const searchIcon = style({
  position: 'absolute',
  insetInlineStart: vars.space.sm,
  display: 'inline-flex',
  color: vars.color.text.secondary,
  pointerEvents: 'none',
})

export const spacer = style({ flex: '1 1 auto' })

/** Botão primário "Criar Plano" (ciano). */
export const createButton = style({
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.lg,
  borderRadius: vars.radius.md,
  border: 'none',
  background: vars.color.brand.normal,
  color: vars.color.brand.onBrand,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  selectors: {
    '&:hover': { background: vars.color.brand.hover },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

/** Painel expansível do funil — fundo azul-claro, campos + footer. */
export const panel = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  padding: vars.space.md,
  borderRadius: vars.radius.lg,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  background: vars.color.surface.canvas,
})

export const groupGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
  columnGap: vars.space.md,
  rowGap: vars.space.sm,
  alignItems: 'end',
  '@media': {
    '(min-width: 48rem)': { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' },
  },
})

export const fieldWrap = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  minInlineSize: 0,
})

export const fieldLabel = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.secondary,
  whiteSpace: 'nowrap',
})

export const select = style({
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

export const panelFooter = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  flexWrap: 'wrap',
  gap: vars.space.sm,
  paddingBlockStart: vars.space.sm,
  borderBlockStart: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
})

const footerButtonBase = style({
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.lg,
  borderRadius: vars.radius.md,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  cursor: 'pointer',
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
})
export const applyButton = style([
  footerButtonBase,
  {
    background: vars.color.brand.normal,
    color: vars.color.brand.onBrand,
    borderColor: vars.color.brand.normal,
    selectors: { '&:hover': { background: vars.color.brand.hover, borderColor: vars.color.brand.hover } },
  },
])
export const clearButton = style([
  footerButtonBase,
  { background: 'transparent', color: vars.color.text.secondary },
])
