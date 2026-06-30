/**
 * Estilos COMPARTILHADOS dos filtros dos grids de parceiros (modelo "Filtros Avançados" do Colaborador).
 * Cada grid faz um shim (`*-filters.css.ts`) que reexporta isto e escolhe a cor do chip aplicado por tipo
 * (`appliedChipVariant`/`appliedChipRemoveVariant`). Mantém uma única fonte de verdade do visual do filtro.
 */
import { style, styleVariants } from '@vanilla-extract/css'

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
  { background: vars.color.brand.normal, color: vars.color.brand.onBrand, borderColor: vars.color.brand.normal },
])

/* Painel expansível "Filtros Avançados" — coluna: header + campos + footer, fundo azul-claro. */
export const panel = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  padding: vars.space.md,
  borderRadius: vars.radius.lg,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  background: vars.color.surface.canvas,
})

export const advancedHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
})

export const funnelBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '2.25rem',
  blockSize: '2.25rem',
  flexShrink: 0,
  borderRadius: vars.radius.md,
  background: vars.color.surface.default,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  color: vars.color.nav.background,
})

export const headerTexts = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.125rem',
  minInlineSize: 0,
  marginInlineEnd: 'auto',
})

export const advancedTitle = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.md,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.nav.background,
})

export const advancedSubtitle = style({
  margin: 0,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  color: vars.color.text.secondary,
})

const linkButtonBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: vars.color.nav.background,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  cursor: 'pointer',
  selectors: {
    '&:hover': { textDecoration: 'underline' },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})
export const collapseButton = style([linkButtonBase, { flexShrink: 0 }])
export const clearAllButton = style([linkButtonBase])

export const chipsRow = style({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: vars.space.xs,
})

/* Chip de filtro aplicado — cor por tipo de grid (mesma paleta dos avatares). */
const appliedChipBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  paddingBlock: vars.space.xs,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.xl,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  whiteSpace: 'nowrap',
})
export const appliedChipVariant = styleVariants({
  collaborator: [appliedChipBase, { background: vars.color.partnerType.collaborator.background, color: vars.color.partnerType.collaborator.text, border: `${vars.borderWidth.thin} solid ${vars.color.partnerType.collaborator.border}` }],
  supplier: [appliedChipBase, { background: vars.color.partnerType.supplier.background, color: vars.color.partnerType.supplier.text, border: `${vars.borderWidth.thin} solid ${vars.color.partnerType.supplier.border}` }],
  financier: [appliedChipBase, { background: vars.color.partnerType.financier.background, color: vars.color.partnerType.financier.text, border: `${vars.borderWidth.thin} solid ${vars.color.partnerType.financier.border}` }],
  act: [appliedChipBase, { background: vars.color.partnerType.act.background, color: vars.color.partnerType.act.text, border: `${vars.borderWidth.thin} solid ${vars.color.partnerType.act.border}` }],
})

const appliedChipRemoveBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  lineHeight: 1,
  selectors: {
    '&:hover': { opacity: 0.7 },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})
export const appliedChipRemoveVariant = styleVariants({
  collaborator: [appliedChipRemoveBase, { color: vars.color.partnerType.collaborator.text }],
  supplier: [appliedChipRemoveBase, { color: vars.color.partnerType.supplier.text }],
  financier: [appliedChipRemoveBase, { color: vars.color.partnerType.financier.text }],
  act: [appliedChipRemoveBase, { color: vars.color.partnerType.act.text }],
})

export const chipsSpacer = style({
  inlineSize: vars.borderWidth.thin,
  blockSize: '1rem',
  background: vars.color.border.default,
  marginInline: vars.space.xs,
})

export const groupSection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
})

export const groupHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.xs,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.nav.background,
})

export const groupGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  columnGap: vars.space.md,
  rowGap: vars.space.sm,
  alignItems: 'end',
  '@media': {
    '(min-width: 64rem)': { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' },
  },
})

export const counterChip = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  paddingBlock: vars.space.xs,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.xl,
  background: vars.color.surface.default,
  color: vars.color.nav.background,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  whiteSpace: 'nowrap',
})

export const field = style({
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
  overflow: 'hidden',
  textOverflow: 'ellipsis',
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
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: vars.space.sm,
  paddingBlockStart: vars.space.sm,
  borderBlockStart: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
})

export const footerRight = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
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
  { background: vars.color.brand.normal, color: vars.color.brand.onBrand, borderColor: vars.color.brand.normal },
])
export const exportButton = style([
  footerButtonBase,
  { background: vars.color.surface.default, color: vars.color.text.primary },
])
export const clearButton = style([
  footerButtonBase,
  { background: 'transparent', color: vars.color.text.secondary, borderColor: vars.color.border.default },
])

export const group = style({
  display: 'inline-flex',
  gap: vars.space.xs,
})

const chipBase = style({
  paddingBlock: vars.space.xs,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.secondary,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  cursor: 'pointer',
  transitionProperty: 'background-color, border-color',
  transitionDuration: '150ms',
  selectors: {
    '&:hover': { background: vars.color.surface.subtle },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
  '@media': {
    '(prefers-reduced-motion: reduce)': { transitionDuration: '0.01ms' },
  },
})
export const chip = style([chipBase])
export const chipActive = style([
  chipBase,
  {
    background: vars.color.brand.normal,
    color: vars.color.brand.onBrand,
    borderColor: vars.color.brand.normal,
    selectors: {
      '&:hover': { background: vars.color.brand.hover, borderColor: vars.color.brand.hover },
    },
  },
])
