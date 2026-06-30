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

/* Coluna Nome — avatar circular com iniciais + nome. */
export const nameCell = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  minInlineSize: 0,
})

export const avatar = style({
  inlineSize: '2rem',
  blockSize: '2rem',
  flexShrink: 0,
  borderRadius: '50%',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  // Cor por tipo de parceiro (este grid é só Colaborador → tom amarelo), igual aos contratos.
  background: vars.color.partnerType.collaborator.background,
  color: vars.color.partnerType.collaborator.text,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  textTransform: 'uppercase',
})

export const nameText = style({
  minInlineSize: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})
