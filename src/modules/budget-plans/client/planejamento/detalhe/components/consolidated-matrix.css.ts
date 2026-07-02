/**
 * Estilos da matriz "Consolidado por Mês" (Detalhe do plano). Só tokens (§X). Reproduz o mapa §1.4:
 * título + toggles (pílulas, ativo em cor de marca) + nav de meses; tabela Centro×Meses com linha TOTAL
 * destacada. Valores mensais alinhados à direita (tabular-nums).
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
})

export const sectionHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.md,
  flexWrap: 'wrap',
})

export const sectionTitle = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
})

export const controls = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
})

export const toggleGroup = style({
  display: 'inline-flex',
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  overflow: 'hidden',
})

export const toggle = style({
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.md,
  border: 'none',
  background: vars.color.surface.default,
  color: vars.color.text.secondary,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  selectors: {
    '&:hover': { background: vars.color.surface.subtle },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: `calc(-1 * ${vars.focusRing.width})`,
    },
  },
})

export const toggleActive = style({
  background: vars.color.brand.normal,
  color: vars.color.brand.onBrand,
  selectors: { '&:hover': { background: vars.color.brand.hover } },
})

export const navButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '2rem',
  blockSize: '2rem',
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.primary,
  fontSize: vars.font.size.lg,
  lineHeight: 1,
  cursor: 'pointer',
  selectors: {
    '&:hover': { background: vars.color.surface.subtle },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const navDisabled = style({
  opacity: 0.4,
  cursor: 'not-allowed',
  selectors: { '&:hover': { background: vars.color.surface.default } },
})

export const container = style({
  inlineSize: '100%',
  overflowX: 'auto',
  borderRadius: vars.radius.lg,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  background: vars.color.surface.default,
})

export const table = style({
  inlineSize: '100%',
  borderCollapse: 'collapse',
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
})

export const th = style({
  textAlign: 'start',
  padding: `${vars.space.sm} ${vars.space.md}`,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: vars.color.nav.background,
  background: vars.color.surface.canvas,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  whiteSpace: 'nowrap',
})

export const thMonth = style([th, { textAlign: 'end' }])

export const row = style({
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  selectors: { '&:hover': { background: vars.color.surface.subtle } },
})

export const nameCell = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.xs,
  padding: `${vars.space.sm} ${vars.space.md}`,
  minInlineSize: '16rem',
})

export const indent = style({
  display: 'inline-block',
  inlineSize: vars.space.lg,
  flexShrink: 0,
})

export const chevronButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '1.5rem',
  blockSize: '1.5rem',
  flexShrink: 0,
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: vars.color.text.secondary,
  cursor: 'pointer',
  borderRadius: vars.radius.sm,
  selectors: {
    '&:hover': { background: vars.color.surface.subtle, color: vars.color.text.primary },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const nameText = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.125rem',
  minInlineSize: 0,
})

export const ccSubtotal = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  color: vars.color.text.secondary,
  fontVariantNumeric: 'tabular-nums',
})

export const monthCell = style({
  padding: `${vars.space.sm} ${vars.space.md}`,
  textAlign: 'end',
  whiteSpace: 'nowrap',
  fontVariantNumeric: 'tabular-nums',
})

export const totalRow = style({
  background: vars.color.surface.canvas,
  fontWeight: vars.font.weight.semibold,
})

export const totalLabelCell = style({
  padding: `${vars.space.sm} ${vars.space.md}`,
  fontFamily: vars.font.family.heading,
  whiteSpace: 'nowrap',
})

export const totalMonthCell = style([monthCell, { fontWeight: vars.font.weight.semibold }])
