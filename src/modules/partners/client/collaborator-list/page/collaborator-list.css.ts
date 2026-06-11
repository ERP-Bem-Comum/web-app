import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const screen = style({
  padding: vars.space.xl,
  display: 'flex',
  flexDirection: 'column',
})

/* Toolbar: ações do cabeçalho (Importar CSV/Excel + Adicionar Colaborador) */
export const toolbarActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
})

/* Botão secundário "Importar CSV/Excel" (outline — o Button átomo é só primário) */
export const importButton = style({
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.lg,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.primary,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  selectors: {
    '&:hover': { background: vars.color.surface.subtle },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

/* Coluna Status — duplo: badge de ativação + situação cadastral abaixo (legado) */
export const statusCell = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: vars.space.xs,
})

export const registrationText = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  color: vars.color.text.muted,
})
