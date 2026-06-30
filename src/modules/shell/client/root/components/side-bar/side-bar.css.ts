import { style, styleVariants } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const nav = style({
  background: vars.color.nav.background,
  color: vars.color.nav.textActive,
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  blockSize: '100%',
  overflow: 'hidden',
  transition: 'inline-size 200ms ease',
})

export const navWidth = styleVariants({
  expanded: { inlineSize: '14rem' }, // 224px — ajustado p/ ficar mais justo aos nomes dos módulos
  collapsed: { inlineSize: '4rem' }, // 64px
})

export const toggle = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  background: 'transparent',
  color: vars.color.nav.textMuted,
  cursor: 'pointer',
  paddingBlock: vars.space.sm,
  blockSize: '2.75rem',
  flexShrink: 0,
  transition: 'background 150ms ease, color 150ms ease',
  selectors: {
    '&:hover': { background: vars.color.nav.itemHover, color: vars.color.nav.textActive },
  },
})

export const menuList = style({
  paddingBlock: vars.space.sm,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  flex: 1,
})

export const itemContent = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  inlineSize: '100%',
})

export const itemContentCollapsed = style({
  gap: 0,
  justifyContent: 'center',
})

export const itemLabel = style({
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

export const item = style({
  inlineSize: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  border: 'none',
  background: 'transparent',
  // Mais respiro vertical por módulo (sm + xs = 0.75rem).
  paddingBlock: `calc(${vars.space.sm} + ${vars.space.xs})`,
  paddingInline: vars.space.md,
  // +1px sobre o `sm` (14px) → 15px, por pedido de legibilidade do menu.
  fontSize: '0.9375rem',
  fontFamily: vars.font.family.body,
  fontWeight: vars.font.weight.medium,
  color: vars.color.nav.textMuted,
  textDecoration: 'none',
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'background 150ms ease, color 150ms ease',
  selectors: {
    '&:hover:not([data-active])': { background: vars.color.nav.itemHover },
    '&[data-active]': {
      background: vars.color.nav.itemActive,
      color: vars.color.nav.textActive,
      fontWeight: vars.font.weight.semibold,
    },
  },
})

export const itemCollapsed = style({
  justifyContent: 'center',
  paddingInline: 0,
})

export const chevron = style({
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
  marginInlineStart: vars.space.sm,
})

export const submenu = style({
  background: vars.color.nav.submenuBackground,
})

export const subItem = style({
  display: 'block',
  paddingBlock: '0.625rem',
  paddingInlineStart: '2.875rem', // 46px
  paddingInlineEnd: vars.space.md,
  color: vars.color.nav.textMuted,
  background: 'transparent',
  textDecoration: 'none',
  // +1px sobre o `xs` (12px) → 13px (submódulo), acompanhando o aumento dos módulos.
  fontSize: '0.8125rem',
  fontFamily: vars.font.family.body,
  fontWeight: vars.font.weight.regular,
  borderInlineStart: `${vars.borderWidth.thick} solid transparent`,
  transition: 'background 150ms ease, color 150ms ease',
  selectors: {
    '&:hover:not([data-active])': {
      background: `color-mix(in srgb, ${vars.color.brand.normal} 15%, transparent)`,
      color: vars.color.nav.textActive,
    },
    '&[data-active]': {
      color: vars.color.nav.textActive,
      background: `color-mix(in srgb, ${vars.color.brand.normal} 25%, transparent)`,
      borderInlineStartColor: vars.color.brand.normal,
      fontWeight: vars.font.weight.semibold,
    },
  },
})
