import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const screen = style({
  boxSizing: 'border-box',
  blockSize: '100%',
  overflowY: 'auto',
  padding: vars.space.xl,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
  scrollbarWidth: 'thin',
  scrollbarColor: `${vars.color.border.default} transparent`,
})

export const logoCell = style({
  display: 'flex',
  alignItems: 'center',
})

export const logoPlaceholder = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '2.75rem',
  blockSize: '2.75rem',
  borderRadius: '50%',
  background: vars.color.surface.subtle,
  color: vars.color.text.muted,
})

// Logo real do programa (data URL via BFF) — mesmo gabarito do placeholder.
export const logoImg = style({
  inlineSize: '2.75rem',
  blockSize: '2.75rem',
  borderRadius: '50%',
  objectFit: 'cover',
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
})
