/**
 * Estilos do painel de estado (loading/erro) dos relatórios religados ao core-api (#114). View burra, só-tokens
 * (§X): um cartão único centralizado dentro do `screen` full-bleed, no mesmo tom do empty-state honesto das
 * telas de Posição. Nenhum hex/px cru.
 */
import { style } from '@vanilla-extract/css'

import { brand } from '#shared/ui/brand/grid-brand.values.ts'
import { vars } from '#shared/ui/tokens/index.ts'

export const panel = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: brand.space.sm,
  textAlign: 'center',
  paddingBlock: '4rem',
  paddingInline: brand.space.xxl,
  background: brand.color.surface,
  borderRadius: brand.radius.md,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  boxShadow: brand.shadow.card,
})

export const title = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.panelTitle,
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
})

export const hint = style({
  margin: 0,
  fontSize: brand.text.body,
  color: brand.color.ink500,
  maxInlineSize: '32rem',
})
