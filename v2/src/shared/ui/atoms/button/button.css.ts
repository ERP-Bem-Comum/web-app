import { style, styleVariants } from '@vanilla-extract/css'

import { vars } from '../../tokens/index.ts'

// Base do botão (fidelidade v1: full-width, ciano, texto preto, radius, padding). Só `vars.*`.
const base = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  border: 'none',
  cursor: 'pointer',
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  fontFamily: vars.font.family.body,
  fontWeight: vars.font.weight.medium,
  fontSize: vars.font.size.sm,
  background: vars.color.brand.normal,
  color: vars.color.brand.onBrand,
  transitionProperty: 'background-color',
  transitionDuration: '150ms',
  selectors: {
    '&:hover:not(:disabled)': { background: vars.color.brand.hover },
    '&:focus-visible': {
      outline: `2px solid ${vars.color.border.focus}`,
      outlineOffset: '2px',
    },
  },
})

const disabledStyle = style({
  background: vars.color.brand.disabled,
  color: vars.color.brand.onDisabled,
  cursor: 'not-allowed',
})

// Mapa state→className (decisão A1). `normal` é só a base; disabled/loading compõem base + extra.
export const buttonState = styleVariants({
  normal: [base],
  disabled: [base, disabledStyle],
  loading: [base, disabledStyle, { cursor: 'progress' }],
})
