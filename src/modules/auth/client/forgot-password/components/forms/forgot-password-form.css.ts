import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

// Conteúdo interno: stack vertical com gap consistente (espelha o login).
export const content = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
})

// Cabeçalho: logo + título com underline decorativo.
export const header = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: vars.space.sm,
})

export const title = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.xl,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
  margin: 0,
})

// Underline decorativo laranja abaixo do título.
export const titleUnderline = style({
  display: 'block',
  inlineSize: '2.5rem',
  blockSize: '0.1875rem',
  background: vars.color.institutional.orange,
  borderRadius: vars.radius.sm,
  marginInline: 'auto',
})

// Texto de apoio abaixo do título (instrução curta).
export const subtitle = style({
  margin: 0,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
})

// Formulário: stack vertical com respiro entre campos.
export const form = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
})

// Wrapper do botão submit (espelha o login — botão não é full-width).
export const buttonWrap = style({
  paddingInline: vars.space.lg,
})

// Link/botão "Cancelar" — volta ao login.
export const cancelLink = style({
  display: 'block',
  textAlign: 'center',
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.institutional.blueDeep,
  background: 'transparent',
  border: 'none',
  textDecoration: 'none',
  cursor: 'pointer',
  transition: 'color 150ms',
  selectors: {
    '&:hover': { color: vars.color.text.primary },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
      borderRadius: vars.radius.sm,
    },
  },
})

// Bloco de alerta de erro (role="alert" na View).
export const errorText = style({
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  background: vars.color.feedback.errorBg,
  color: vars.color.feedback.errorText,
  textAlign: 'center',
})
