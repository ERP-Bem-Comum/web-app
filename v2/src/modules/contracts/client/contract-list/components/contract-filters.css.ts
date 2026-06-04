import { style, globalStyle } from '@vanilla-extract/css'
import { vars } from '#shared/ui/tokens/index.ts'

export const container = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-end',
  gap: vars.space.md,
  padding: `${vars.space.md} ${vars.space.lg}`,
  borderBottom: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
})

// força picker de data no tema claro (evita dark-mode no calendário nativo)
globalStyle(`${container} input[type="date"]`, {
  colorScheme: 'light',
})

export const fieldLabel = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  fontSize: '0.59375rem',
  fontWeight: vars.font.weight.bold,
  fontFamily: vars.font.family.body,
  color: vars.color.institutional.ink5,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
})

export const input = style({
  height: '2rem',
  paddingInline: vars.space.sm,
  fontSize: '0.78125rem',
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  background: vars.color.surface.default,
  color: vars.color.institutional.ink3,
  fontFamily: vars.font.family.body,
  outline: 'none',
  transition: 'border-color 150ms ease',
  ':focus': {
    borderColor: vars.color.institutional.blueLine,
  },
})

export const valueInput = style({
  width: '8.125rem',
})

export const clearButton = style({
  height: '2rem',
  paddingInline: vars.space.md,
  fontSize: '0.75rem',
  fontWeight: vars.font.weight.medium,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  background: vars.color.surface.default,
  color: vars.color.institutional.ink4,
  cursor: 'pointer',
  fontFamily: vars.font.family.body,
  transition: 'background 150ms ease, border-color 150ms ease',
  marginLeft: 'auto',
  ':hover': {
    background: vars.color.institutional.paperWarm,
    borderColor: vars.color.institutional.paperRule,
  },
})
