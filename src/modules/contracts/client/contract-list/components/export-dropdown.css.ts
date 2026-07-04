import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

export const wrapper = style({
  position: 'relative',
  display: 'inline-flex',
})

export const trigger = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.sm,
  height: '2.75rem',
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid color-mix(in srgb, ${vars.color.institutional.paperRule} 55%, ${vars.color.institutional.paperWarm})`,
  background: vars.color.surface.default,
  color: vars.color.institutional.ink3,
  fontSize: '0.75rem',
  fontWeight: vars.font.weight.medium,
  fontFamily: vars.font.family.body,
  cursor: 'pointer',
  // Profundidade suave (kit de grid) — mesma borda com relevo dos demais controles do filtro.
  boxShadow: brand.shadow.cardDepth,
  transition: 'background 150ms ease, border-color 150ms ease',
  ':hover': {
    background: vars.color.institutional.paperWarm,
    borderColor: vars.color.institutional.ink4,
  },
})

export const menu = style({
  position: 'absolute',
  top: 'calc(100% + 4px)',
  insetInlineEnd: 0,
  zIndex: 50,
  background: vars.color.surface.default,
  borderRadius: vars.radius.lg,
  boxShadow: vars.shadow.cardElevated,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  minWidth: '8.75rem',
  overflow: 'hidden',
})

export const menuItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  width: '100%',
  padding: `${vars.space.sm} ${vars.space.md}`,
  border: 'none',
  background: 'transparent',
  color: vars.color.institutional.ink3,
  fontSize: '0.75rem',
  fontWeight: vars.font.weight.medium,
  fontFamily: vars.font.family.body,
  cursor: 'pointer',
  textAlign: 'left',
  ':hover': {
    background: vars.color.institutional.paperWarm,
  },
})

export const menuItemBorder = style({
  borderTop: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
})
