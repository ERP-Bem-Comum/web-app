import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

// Linha do Badge de status (Ativo/Inativo) no topo do corpo do card "brand".
export const statusRow = style({
  display: 'flex',
  gap: vars.space.xs,
})

// Linha do Badge de Aprovador em Massa (read-only), como um campo dentro da grade "brand".
export const readonlyRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
})

export const readonlyLabel = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
})
