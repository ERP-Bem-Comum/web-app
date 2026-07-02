/**
 * Estilos do modal "Calculando Gastos" (US2.4b): overlay full-screen, barra de abas (centros de custo) e
 * 3 colunas (Categoria / Subcategoria / Despesas). Só tokens (§X).
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const overlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 1200,
  background: vars.color.institutional.overlay,
  display: 'flex',
  alignItems: 'stretch',
  justifyContent: 'center',
})

export const panel = style({
  inlineSize: '100%',
  blockSize: '100%',
  background: vars.color.surface.default,
  display: 'flex',
  flexDirection: 'column',
  fontFamily: vars.font.family.body,
  overflow: 'hidden',
})

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.md,
  paddingBlock: vars.space.md,
  paddingInline: vars.space.lg,
  background: vars.color.surface.subtle,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
})

export const headerTitle = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
})

export const closeButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '2rem',
  blockSize: '2rem',
  borderRadius: vars.radius.md,
  border: 'none',
  background: 'transparent',
  color: vars.color.text.secondary,
  fontSize: vars.font.size.lg,
  lineHeight: 1,
  cursor: 'pointer',
  selectors: {
    '&:hover': { background: vars.color.surface.default, color: vars.color.text.primary },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const tabsBar = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.xs,
  paddingInline: vars.space.sm,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
})

export const tabsScroll = style({
  display: 'flex',
  flex: 1,
  overflowX: 'auto',
})

export const tab = style({
  flex: 1,
  minInlineSize: 'max-content',
  paddingBlock: vars.space.md,
  paddingInline: vars.space.lg,
  border: 'none',
  borderBlockEnd: `${vars.borderWidth.thick} solid transparent`,
  background: 'transparent',
  color: vars.color.text.secondary,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  selectors: {
    '&:hover': { background: vars.color.surface.subtle },
  },
})

export const tabActive = style({
  background: vars.color.brand.normal,
  color: vars.color.brand.onBrand,
  borderBlockEndColor: vars.color.brand.normal,
  selectors: { '&:hover': { background: vars.color.brand.hover } },
})

export const navButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '2rem',
  blockSize: '2rem',
  flexShrink: 0,
  borderRadius: vars.radius.md,
  border: 'none',
  background: 'transparent',
  color: vars.color.text.primary,
  fontSize: vars.font.size.lg,
  lineHeight: 1,
  cursor: 'pointer',
  selectors: {
    '&:hover:not(:disabled)': { background: vars.color.surface.subtle },
    '&:disabled': { opacity: 0.3, cursor: 'not-allowed' },
  },
})

export const columns = style({
  flex: 1,
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: vars.space.lg,
  padding: vars.space.lg,
  overflowY: 'auto',
})

export const column = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  padding: vars.space.md,
  borderRadius: vars.radius.lg,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  background: vars.color.surface.default,
  minBlockSize: 0,
})

export const columnTitle = style({
  margin: 0,
  textAlign: 'center',
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.md,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.secondary,
})

export const list = style({ display: 'flex', flexDirection: 'column', gap: vars.space.sm })

export const item = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.sm,
  inlineSize: '100%',
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  border: 'none',
  background: `color-mix(in srgb, ${vars.color.brand.normal} 8%, white)`,
  color: vars.color.text.primary,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  textAlign: 'left',
  cursor: 'pointer',
  selectors: {
    '&:hover': { background: `color-mix(in srgb, ${vars.color.brand.normal} 16%, white)` },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: `calc(-1 * ${vars.focusRing.width})`,
    },
  },
})

export const itemActive = style({
  background: vars.color.brand.normal,
  color: vars.color.brand.onBrand,
  selectors: { '&:hover': { background: vars.color.brand.hover } },
})

export const chevron = style({ flexShrink: 0, opacity: 0.7 })

export const despesaRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.sm,
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  background: `color-mix(in srgb, ${vars.color.brand.normal} 6%, white)`,
})

export const despesaName = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
})

export const despesaEnd = style({ display: 'flex', alignItems: 'center', gap: vars.space.xs })

export const despesaValue = style({
  fontVariantNumeric: 'tabular-nums',
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
})

export const despesaInput = style({
  inlineSize: '7rem',
  paddingBlock: vars.space.xs,
  paddingInline: vars.space.sm,
  borderRadius: vars.radius.sm,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.primary,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
})

export const iconButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '1.5rem',
  blockSize: '1.5rem',
  borderRadius: vars.radius.sm,
  border: 'none',
  background: 'transparent',
  color: vars.color.text.secondary,
  cursor: 'pointer',
  selectors: {
    '&:hover': { background: vars.color.surface.subtle, color: vars.color.text.primary },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const calcularButton = style({
  marginBlockStart: vars.space.sm,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.xs,
  inlineSize: '100%',
  paddingBlock: vars.space.sm,
  borderRadius: vars.radius.md,
  border: 'none',
  background: vars.color.brand.normal,
  color: vars.color.brand.onBrand,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  cursor: 'pointer',
  selectors: {
    '&:hover': { background: vars.color.brand.hover },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const empty = style({
  padding: vars.space.lg,
  textAlign: 'center',
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
})

// ── Form "Configuração" (abre no lápis) ──
export const columnHead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
})

export const infoButton = style({
  position: 'absolute',
  insetInlineEnd: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  background: 'transparent',
  color: vars.color.text.secondary,
  cursor: 'pointer',
})

export const configForm = style({ display: 'flex', flexDirection: 'column', gap: vars.space.md })

export const configSection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
  padding: vars.space.md,
  borderRadius: vars.radius.md,
  background: `color-mix(in srgb, ${vars.color.brand.normal} 6%, white)`,
})

export const configSectionTitle = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.bold,
  letterSpacing: '0.04em',
  color: vars.color.text.secondary,
})

export const switchRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
  cursor: 'pointer',
})

export const field = style({ display: 'flex', flexDirection: 'column', gap: vars.space.xs })

export const fieldLabel = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.secondary,
})

export const fieldInput = style({
  inlineSize: '100%',
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.primary,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
})

export const custoTotalBox = style({
  marginBlockStart: vars.space.xs,
  paddingBlock: vars.space.sm,
  textAlign: 'center',
  borderRadius: vars.radius.md,
  background: `color-mix(in srgb, ${vars.color.brand.normal} 22%, white)`,
  color: vars.color.text.primary,
  fontWeight: vars.font.weight.bold,
  fontVariantNumeric: 'tabular-nums',
})

export const checkRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  paddingBlock: vars.space.xs,
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
  cursor: 'pointer',
  borderBlockEnd: `${vars.borderWidth.thin} solid color-mix(in srgb, ${vars.color.brand.normal} 20%, transparent)`,
})

export const formActions = style({ display: 'flex', gap: vars.space.sm, marginBlockStart: vars.space.sm })

export const cancelButton = style({
  flex: 1,
  paddingBlock: vars.space.sm,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.primary,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  cursor: 'pointer',
  selectors: { '&:hover': { background: vars.color.surface.subtle } },
})

export const applyButton = style({
  flex: 1,
  paddingBlock: vars.space.sm,
  borderRadius: vars.radius.md,
  border: 'none',
  background: vars.color.brand.normal,
  color: vars.color.brand.onBrand,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  cursor: 'pointer',
  selectors: { '&:hover': { background: vars.color.brand.hover } },
})
