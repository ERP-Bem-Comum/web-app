import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

// Estilo INTERNO do LoginForm. O Card (átomo) é inlineSize:100% e NÃO fixa max-width de propósito —
// quem constrange a largura é este consumidor. Só-tokens, logical properties.

// Constrange o Card (100%) a uma medida de leitura confortável (fidelidade v1 max-w-md ≈ 28rem).
// max-inline-size + inline-size:100% = nunca estoura no mobile (SC-006, sem overflow horizontal).
export const cardShell = style({
  inlineSize: '100%',
  maxInlineSize: '28rem',
})

// Conteúdo do card: separa o cabeçalho do formulário (gap maior que o interno de cada um).
export const content = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
})

// Cabeçalho: stack vertical centralizado (logo + título + subtítulo).
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
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
})

export const subtitle = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.muted,
})

// Form: stack vertical com respiro entre os campos.
export const form = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
})

// Linha "lembrar-me": checkbox + label lado a lado.
export const rememberRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
})

export const rememberLabel = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
})

// Bloco de alerta de erro (role="alert" na View). Fundo + texto de feedback, padding lógico, radius.
export const errorText = style({
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  background: vars.color.feedback.errorBg,
  color: vars.color.feedback.errorText,
})
