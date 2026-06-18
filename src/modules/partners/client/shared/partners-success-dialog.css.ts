import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

// <dialog> nativo informativo de 1 botão — mesmo padrão visual do confirm-dialog (overlay
// institucional, top-layer, focus-trap via showModal). Conteúdo centralizado com check verde.
export const dialog = style({
  border: 'none',
  inlineSize: '100%',
  maxInlineSize: '24rem',
  padding: vars.space.lg,
  borderRadius: vars.radius.lg,
  background: vars.color.surface.default,
  color: vars.color.text.primary,
  boxShadow: vars.shadow.cardElevated,
  selectors: {
    '&[open]': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: vars.space.md,
    },
    '&::backdrop': {
      background: vars.color.institutional.overlay,
    },
  },
})

export const icon = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: vars.color.institutional.green,
})

export const title = style({
  margin: 0,
  textAlign: 'center',
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
})

export const message = style({
  margin: 0,
  textAlign: 'center',
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
})

export const actions = style({
  display: 'flex',
  justifyContent: 'center',
  inlineSize: '100%',
})

export const okWrap = style({
  inlineSize: '10rem',
})
