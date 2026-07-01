/**
 * Layout da página de Planejamento (lista). Cartão branco com a barra de filtros + tabela + paginação,
 * dentro da área de conteúdo do shell (altura fixa → rola o próprio conteúdo). Só tokens (§X).
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const screen = style({
  padding: vars.space.xl,
  display: 'flex',
  flexDirection: 'column',
  blockSize: '100%',
  overflowY: 'auto',
  fontFamily: vars.font.family.body,
})

export const card = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  padding: vars.space.lg,
  borderRadius: vars.radius.lg,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  background: vars.color.surface.default,
})
