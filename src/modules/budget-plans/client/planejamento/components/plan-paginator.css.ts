/**
 * Estilos do rodapé de paginação da lista de Planejamento (§1.1: "Itens por página: 5 · 1-1 · ‹ ›").
 * Só tokens (§X).
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const paginator = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: vars.space.md,
  paddingBlock: vars.space.md,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
})

export const perPageWrap = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.sm,
})

export const perPageSelect = style({
  blockSize: '2rem',
  paddingInline: vars.space.sm,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.primary,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
})

export const range = style({ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' })

export const button = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '2rem',
  blockSize: '2rem',
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.primary,
  cursor: 'pointer',
  selectors: {
    '&:hover:not(:disabled)': { background: vars.color.surface.subtle },
    '&:disabled': { opacity: 0.4, cursor: 'not-allowed' },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})
