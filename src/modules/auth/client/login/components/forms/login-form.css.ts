import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

// Conteúdo interno: stack vertical com gap consistente.
export const content = style({
  display: 'flex',
  flexDirection: 'column',
  gap: `calc(${vars.space.xl} + ${vars.space.sm})`,
})

// Cabeçalho: logo + título com underline decorativo.
export const header = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: vars.space.lg,
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
  marginBlockStart: vars.space.sm,
  marginInline: 'auto',
})

// Formulário: stack vertical com respiro entre campos.
export const form = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
})

// Link "Esqueci Minha Senha" — posicionado acima do botão, estilo bold.
export const forgotLink = style({
  display: 'block',
  textAlign: 'center',
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.institutional.blueDeep,
  textDecoration: 'none',
  cursor: 'pointer',
  transition: 'color 150ms',
  marginBlockEnd: vars.space.md,
  selectors: {
    '&:hover': { color: vars.color.text.primary },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
      borderRadius: vars.radius.sm,
    },
  },
})

// Wrapper do botão submit: margens nas laterais (botão não é full-width no login).
export const buttonWrap = style({
  paddingInline: vars.space.lg,
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
