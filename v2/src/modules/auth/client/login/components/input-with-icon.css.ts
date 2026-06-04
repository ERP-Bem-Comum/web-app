import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

// Container relativo: o input ocupa 100%, o ícone flutua à direita.
export const inputWrap = style({
  position: 'relative',
  inlineSize: '100%',
})

// Ícone posicionado à direita do input, verticalmente centralizado.
export const iconSlot = style({
  position: 'absolute',
  insetBlockStart: '50%',
  insetInlineEnd: '0.75rem',
  transform: 'translateY(-50%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none',
  color: vars.color.text.muted,
  flexShrink: 0,
})

// Ícone em laranja (ex: olho de toggle de senha).
export const iconOrange = style({
  color: vars.color.institutional.orange,
})

// Quando o ícone é um botão (ex: toggle de senha), habilita interação.
export const iconButton = style({
  position: 'absolute',
  insetBlockStart: '50%',
  insetInlineEnd: '0.75rem',
  transform: 'translateY(-50%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  borderRadius: vars.radius.sm,
  color: vars.color.text.muted,
  transition: 'color 150ms',
  selectors: {
    '&:hover': { color: vars.color.text.secondary },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})
