/**
 * Estilos do footer/paginação de Colaboradores (mock "colaboradores-brand"): "Itens por página" à esquerda,
 * pager (Anterior / Página X de Y / Próxima) à direita. Consome os tokens ESCOPADOS `collab`.
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

import { collab } from '../collab-brand.values.ts'

export const paginator = style({
  display: 'flex',
  alignItems: 'center',
  gap: collab.space.lg,
  paddingBlock: collab.space.lg,
  paddingInline: vars.space.xs,
  marginBlockStart: collab.space.sm,
  fontFamily: vars.font.family.heading,
  color: collab.color.ink400,
  fontSize: collab.text.body,
})

/* "Itens por página" + seletor (à esquerda) */
export const perPageWrap = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: collab.space.sm,
})

export const perPageSelect = style({
  blockSize: collab.size.pagerHeight,
  paddingInline: collab.space.sm,
  borderRadius: collab.radius.sm,
  border: `${vars.borderWidth.thin} solid ${collab.color.line}`,
  background: collab.color.surface,
  color: collab.color.ink700,
  fontFamily: vars.font.family.heading,
  fontSize: collab.text.body,
  cursor: 'pointer',
})

/* Bloco do pager, empurrado p/ a direita */
export const pager = style({
  marginInlineStart: 'auto',
  display: 'inline-flex',
  alignItems: 'center',
  gap: collab.space.sm,
})

export const label = style({
  fontWeight: collab.weight.medium,
  color: collab.color.ink500,
})

export const button = style({
  blockSize: collab.size.pagerHeight,
  paddingInline: collab.space.lg,
  borderRadius: collab.radius.sm,
  border: `${vars.borderWidth.thin} solid ${collab.color.line}`,
  background: collab.color.surface,
  color: collab.color.ink700,
  fontFamily: vars.font.family.heading,
  fontSize: collab.text.body,
  fontWeight: collab.weight.semibold,
  cursor: 'pointer',
  transitionProperty: 'background-color, border-color',
  transitionDuration: '150ms',
  selectors: {
    '&:hover:not(:disabled)': { background: collab.color.surfaceAlt, borderColor: collab.color.ink400 },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${collab.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
    '&:disabled': { color: collab.color.ink400, cursor: 'default' },
  },
  '@media': {
    '(prefers-reduced-motion: reduce)': { transitionDuration: '0.01ms' },
  },
})
