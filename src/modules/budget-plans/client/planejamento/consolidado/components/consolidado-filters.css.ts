/**
 * Estilos da barra de filtros do Consolidado ABC (HANDBOOK §2): Ano Base + Programa(s) + "Filtrar" e, à
 * direita, "Exportar Excel/CSV". Espelha o visual do funil do Planejamento (painel azul-claro, selects,
 * botão de aplicar). Só tokens (§X).
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const bar = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'end',
  gap: vars.space.md,
  padding: vars.space.md,
  borderRadius: vars.radius.lg,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  background: vars.color.surface.canvas,
})

export const fieldWrap = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  minInlineSize: '10rem',
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

/** Multi-seleção de programas (chips com checkbox). */
export const programChips = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.xs,
})

const chipBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  paddingBlock: vars.space.xs,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.xl,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.secondary,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  cursor: 'pointer',
  selectors: {
    '&:hover': { background: vars.color.surface.subtle },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})
export const chip = style([chipBase])
export const chipActive = style([
  chipBase,
  {
    background: vars.color.brand.normal,
    color: vars.color.brand.onBrand,
    borderColor: vars.color.brand.normal,
    selectors: { '&:hover': { background: vars.color.brand.hover } },
  },
])

export const spacer = style({ flex: '1 1 auto' })

const buttonBase = style({
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.lg,
  borderRadius: vars.radius.md,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
})

export const applyButton = style([
  buttonBase,
  {
    background: vars.color.brand.normal,
    color: vars.color.brand.onBrand,
    borderColor: vars.color.brand.normal,
    selectors: { '&:hover': { background: vars.color.brand.hover, borderColor: vars.color.brand.hover } },
  },
])

export const exportButton = style([
  buttonBase,
  { background: vars.color.surface.default, color: vars.color.text.primary },
])
