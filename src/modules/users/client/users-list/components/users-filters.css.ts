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
  '@media': { '(prefers-reduced-motion: reduce)': { transitionDuration: '0.01ms' } },
})

export const chip = style([chipBase])
export const chipActive = style([
  chipBase,
  {
    background: vars.color.brand.normal,
    color: vars.color.brand.onBrand,
    borderColor: vars.color.brand.normal,
    selectors: { '&:hover': { background: vars.color.brand.hover, borderColor: vars.color.brand.hover } },
  },
])
