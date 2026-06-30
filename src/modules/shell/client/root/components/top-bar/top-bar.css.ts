import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const header = style({
  position: 'fixed',
  insetBlockStart: 0,
  insetInline: 0,
  blockSize: vars.size.topbar,
  background: vars.color.nav.surface,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.nav.border}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingInline: vars.space.lg,
  zIndex: 1000,
})

export const brand = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.625rem',
})

export const logoImg = style({
  objectFit: 'contain',
  borderRadius: vars.radius.md,
})

export const brandTitle = style({
  fontSize: vars.font.size.md,
  fontWeight: vars.font.weight.bold,
  color: vars.color.nav.ink,
  fontFamily: vars.font.family.heading,
})

export const userMenu = style({
  position: 'relative',
})

export const userTrigger = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.625rem',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  paddingBlock: vars.space.xs,
  paddingInline: vars.space.sm,
  borderRadius: vars.radius.lg,
  transition: 'background 150ms ease',
  selectors: {
    '&:hover': { background: vars.color.nav.surfaceHover },
  },
})

export const avatar = style({
  inlineSize: '2rem',
  blockSize: '2rem',
  borderRadius: '50%',
  background: vars.color.brand.normal,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.nav.textActive,
  fontFamily: vars.font.family.body,
  flexShrink: 0,
})

export const greeting = style({
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  color: vars.color.nav.textOnSurface,
  fontFamily: vars.font.family.body,
  whiteSpace: 'nowrap',
})

export const dropdown = style({
  position: 'absolute',
  insetBlockStart: 'calc(100% + 0.375rem)',
  insetInlineEnd: 0,
  background: vars.color.nav.surface,
  border: `${vars.borderWidth.thin} solid ${vars.color.nav.border}`,
  borderRadius: vars.radius.lg,
  boxShadow: vars.shadow.cardElevated,
  minInlineSize: '10rem',
  padding: vars.space.xs,
  zIndex: 400,
})

export const logoutItem = style({
  inlineSize: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: '0.625rem',
  paddingBlock: '0.625rem',
  paddingInline: '0.75rem',
  background: 'transparent',
  border: 'none',
  borderRadius: vars.radius.md,
  cursor: 'pointer',
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  color: vars.color.nav.textOnSurface,
  fontFamily: vars.font.family.body,
  textAlign: 'left',
  transition: 'background 150ms ease',
  selectors: {
    '&:hover': { background: vars.color.nav.surfaceHover },
  },
})
