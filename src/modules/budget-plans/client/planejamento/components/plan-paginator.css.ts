/**
 * Rodapé de paginação da lista de Planejamento ("Itens por página: 5 · 1-1 · ‹ ›"), no padrão "brand"
 * (mock `planejamento-brand`): tipografia Inter + neutros do kit. Só tokens (§X).
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

export const paginator = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: brand.space.md,
  fontFamily: vars.font.family.heading, // Inter
  fontSize: brand.text.dd,
  color: brand.color.ink500,
})

export const perPageWrap = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: brand.space.sm,
})

export const perPageSelect = style({
  blockSize: '2rem',
  paddingInline: brand.space.sm,
  borderRadius: brand.radius.sm,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: brand.color.surface,
  color: brand.color.ink700,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.dd,
})

export const range = style({ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' })

export const button = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '2rem',
  blockSize: '2rem',
  borderRadius: brand.radius.sm,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: brand.color.surface,
  color: brand.color.ink700,
  cursor: 'pointer',
  selectors: {
    '&:hover:not(:disabled)': { background: brand.color.surfaceAlt },
    '&:disabled': { opacity: 0.4, cursor: 'not-allowed' },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})
