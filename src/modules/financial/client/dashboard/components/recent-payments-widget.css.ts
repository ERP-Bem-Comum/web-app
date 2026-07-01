/**
 * Widget "Últimos pagamentos" (042) — estilos (vanilla-extract, §X: só-tokens, zero hex/px cru). Card com
 * título + tabela (Fornecedor · Conta débito · Valor · Data). `fontFamily: vars.font.family.body` no
 * container garante Nunito (o body default cai em Times — serifa). Skeleton = linhas neutras.
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const card = style({
  fontFamily: vars.font.family.body,
  background: vars.color.surface.default,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.lg,
  boxShadow: vars.shadow.card,
  padding: vars.space.md,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
})

export const title = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.md,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
  paddingBlockEnd: vars.space.xs,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
})

export const table = style({
  inlineSize: '100%',
  borderCollapse: 'collapse',
  fontSize: vars.font.size.sm,
})

// Cabeçalho: minúsculo, MAIÚSCULAS, espaçado — refinado (padrão de tabela de dashboard).
export const th = style({
  textAlign: 'left',
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: vars.color.text.muted,
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.sm,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
})

export const thValue = style([th, { textAlign: 'right' }])

// Linha com hover suave (zebra ao passar o mouse) — dá vida à tabela sem poluir.
export const row = style({
  transition: 'background 120ms ease',
  selectors: {
    '&:hover': { background: vars.color.surface.subtle },
  },
})

export const td = style({
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.sm,
  color: vars.color.text.secondary,
  borderBlockEnd: `${vars.borderWidth.hairline} solid ${vars.color.border.subtle}`,
  // Sem divisória na última linha (contexto do pai — VE exige que o seletor termine em `&`).
  selectors: {
    'tr:last-child &': { borderBlockEnd: 'none' },
  },
})

export const tdName = style([
  td,
  {
    fontWeight: vars.font.weight.semibold,
    color: vars.color.text.primary,
  },
])

export const tdValue = style([
  td,
  {
    textAlign: 'right',
    fontFamily: vars.font.family.mono,
    fontWeight: vars.font.weight.semibold,
    color: vars.color.text.primary,
    fontVariantNumeric: 'tabular-nums',
  },
])

export const note = style({
  color: vars.color.text.muted,
  fontSize: vars.font.size.sm,
  textAlign: 'center',
  paddingBlock: vars.space.xl,
})

export const errorNote = style([note, { color: vars.color.feedback.errorText }])

export const skeletonRow = style({
  blockSize: vars.font.size.lg,
  background: vars.color.surface.subtle,
  borderRadius: vars.radius.sm,
  marginBlock: vars.space.xs,
})
