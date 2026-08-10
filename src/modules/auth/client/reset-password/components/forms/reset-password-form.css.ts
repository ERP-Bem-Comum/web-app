import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

// Conteúdo interno: stack vertical com gap consistente (espelha o login/forgot-password).
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

export const titleUnderline = style({
  display: 'block',
  inlineSize: '2.5rem',
  blockSize: '0.1875rem',
  background: vars.color.institutional.orange,
  borderRadius: vars.radius.sm,
  marginInline: 'auto',
})

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
  gap: vars.space.md,
})

// Linha do campo de senha: input + botão de olho (espelha o reset-password-modal).
export const fieldRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.xs,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  paddingInlineEnd: vars.space.sm,
  selectors: {
    '&:focus-within': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const passwordInput = style({
  flex: 1,
  minInlineSize: 0,
  border: 'none',
  background: 'transparent',
  color: vars.color.text.primary,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.md,
  selectors: {
    '&:focus': { outline: 'none' },
  },
})

export const eyeButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  background: 'transparent',
  color: vars.color.brand.normal,
  cursor: 'pointer',
  padding: vars.space.xs,
  selectors: {
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const mismatch = style({
  color: vars.color.feedback.errorText,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
})

export const rulesTitle = style({
  margin: 0,
  marginBlockEnd: vars.space.xs,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
})

export const rulesList = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
})

export const rule = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
})

export const ruleIconOk = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '1.1rem',
  color: vars.color.status.activeText,
  fontWeight: vars.font.weight.semibold,
})

export const ruleIconFail = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '1.1rem',
  color: vars.color.feedback.errorText,
  fontWeight: vars.font.weight.semibold,
})

// Wrapper do botão submit (espelha o login — botão não é full-width).
export const buttonWrap = style({
  paddingInline: vars.space.lg,
})

// Link/botão "Voltar ao login".
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
