/**
 * Grid de contas de Conciliação (TELA 1) — estilos (vanilla-extract, só-tokens §X). Por ora é CHROME
 * honesto: a listagem de contas-cedente depende do core-api#168. Mostra um estado vazio anunciado + CTA
 * para abrir o workspace com a conta de teste (placeholder), sem fabricar linhas.
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const screen = style({
  display: 'flex',
  flexDirection: 'column',
  minBlockSize: '100%',
  background: vars.color.surface.canvas,
})

export const emptyCard = style({
  margin: 'auto',
  maxInlineSize: '34rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.md,
  paddingBlock: vars.space.xl,
  paddingInline: vars.space.lg,
  textAlign: 'center',
})

export const title = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
})

export const body = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
  lineHeight: 1.5,
})

export const actions = style({
  display: 'flex',
  gap: vars.space.sm,
  flexWrap: 'wrap',
  justifyContent: 'center',
})

export const btnPrimary = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.375rem',
  paddingInline: vars.space.md,
  paddingBlock: '0.5rem',
  borderRadius: vars.radius.md,
  border: 'none',
  background: vars.color.brand.normal,
  color: vars.color.brand.onBrand,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  textDecoration: 'none',
  cursor: 'pointer',
})

export const btnSecondary = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.375rem',
  paddingInline: vars.space.md,
  paddingBlock: '0.5rem',
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.secondary,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  cursor: 'not-allowed',
  opacity: 0.55,
})
