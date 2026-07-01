/**
 * SuppliersWithoutContractCard — estilos (vanilla-extract, §X: só-tokens, zero hex/px cru). Card branco
 * com título e botão de largura total. `fontFamily: vars.font.family.body` evita a serifa do body default.
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const card = style({
  fontFamily: vars.font.family.body,
  background: vars.color.surface.default,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.lg,
  boxShadow: vars.shadow.card,
  padding: vars.space.lg,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
})

export const title = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.md,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
})

// Lista de fornecedores (nome à esquerda, valor à direita). Divisórias sutis entre linhas.
export const list = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
})

export const row = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.md,
  paddingBlock: vars.space.sm,
  borderBlockEnd: `${vars.borderWidth.hairline} solid ${vars.color.border.subtle}`,
  selectors: {
    '&:last-child': { borderBlockEnd: 'none' },
  },
})

export const rowName = style({
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
})

export const rowValue = style({
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.secondary,
  whiteSpace: 'nowrap',
})

export const seeAllButton = style({
  inlineSize: '100%',
  padding: vars.space.sm,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  background: vars.color.surface.subtle,
  color: vars.color.brand.normal,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  cursor: 'pointer',
  selectors: {
    '&:hover': {
      background: vars.color.nav.surfaceHover,
    },
  },
})
