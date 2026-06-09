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
  { background: vars.color.brand.normal, color: vars.color.brand.onBrand, borderColor: vars.color.brand.normal },
])

/* Painel expansível de filtros (mesmo padrão de Colaboradores) */
export const panel = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  columnGap: vars.space.md,
  rowGap: vars.space.sm,
  alignItems: 'end',
  padding: vars.space.lg,
  borderRadius: vars.radius.lg,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  background: vars.color.surface.default,
  '@media': {
    '(min-width: 64rem)': { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' },
  },
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
  selectors: {
    '&:disabled': {
      background: vars.color.surface.subtle,
      color: vars.color.text.muted,
      cursor: 'not-allowed',
    },
  },
})

export const panelFooter = style({
  gridColumn: 'span 2',
  alignSelf: 'end',
  display: 'flex',
  justifyContent: 'flex-end',
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
    // sobrepõe o hover cinza do chipBase — o chip ativo mantém a marca ao passar o mouse.
    selectors: {
      '&:hover': { background: vars.color.brand.hover, borderColor: vars.color.brand.hover },
    },
  },
])
