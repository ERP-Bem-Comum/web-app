import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

// <dialog> nativo: centralizado pelo browser (top-layer). `display:flex` só sob `[open]` para não
// sobrescrever o `display:none` do UA quando fechado. O backdrop usa o overlay institucional.
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
      gap: vars.space.md,
    },
    '&::backdrop': {
      background: vars.color.institutional.overlay,
    },
  },
})

export const title = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
})

export const message = style({
  margin: 0,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
})

export const actions = style({
  display: 'flex',
  justifyContent: 'flex-end',
})

export const confirmWrap = style({
  inlineSize: '10rem',
})
