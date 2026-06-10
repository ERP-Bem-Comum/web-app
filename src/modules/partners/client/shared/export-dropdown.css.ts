import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const wrapper = style({
  position: 'relative',
  display: 'inline-flex',
})

/**
 * Trigger do dropdown = estilização PADRÃO do botão "Exportar" de Parceiros (mesmo look do "Filtrar"):
 * radius.md, fonte heading semibold, borda padrão, fundo branco, texto primário. NÃO usa o estilo do
 * módulo de Contratos.
 */
export const trigger = style({
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.lg,
  borderRadius: vars.radius.md,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.primary,
  cursor: 'pointer',
  selectors: {
    '&:hover': { background: vars.color.surface.subtle },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const menu = style({
  position: 'absolute',
  insetBlockStart: 'calc(100% + 4px)',
  insetInlineEnd: 0,
  zIndex: 50,
  minInlineSize: '10rem',
  background: vars.color.surface.default,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  boxShadow: vars.shadow.cardElevated,
  overflow: 'hidden',
})

export const menuItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  inlineSize: '100%',
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.md,
  border: 'none',
  background: 'transparent',
  color: vars.color.text.primary,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  cursor: 'pointer',
  textAlign: 'left',
  selectors: {
    '&:hover': { background: vars.color.surface.subtle },
  },
})

export const menuItemBorder = style({
  borderBlockStart: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
})
