/**
 * Estilos do BrandPaginator (footer/paginação da identidade "brand"): "Itens por página" à esquerda,
 * pager (Anterior / Página X de Y / Próxima) à direita.
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

import { brand } from './grid-brand.values.ts'

export const paginator = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.lg,
  paddingBlock: brand.space.lg,
  paddingInline: vars.space.xs,
  marginBlockStart: brand.space.sm,
  fontFamily: vars.font.family.heading,
  color: brand.color.ink400,
  fontSize: brand.text.body,
})

export const perPageWrap = style({ display: 'inline-flex', alignItems: 'center', gap: brand.space.sm })

export const perPageSelect = style({
  blockSize: brand.size.pagerHeight,
  paddingInline: brand.space.sm,
  borderRadius: brand.radius.sm,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: brand.color.surface,
  color: brand.color.ink700,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.body,
  cursor: 'pointer',
})

export const pager = style({
  marginInlineStart: 'auto',
  display: 'inline-flex',
  alignItems: 'center',
  gap: brand.space.sm,
})

export const label = style({ fontWeight: brand.weight.medium, color: brand.color.ink500 })

export const button = style({
  blockSize: brand.size.pagerHeight,
  paddingInline: brand.space.lg,
  borderRadius: brand.radius.sm,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: brand.color.surface,
  color: brand.color.ink700,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.body,
  fontWeight: brand.weight.semibold,
  cursor: 'pointer',
  transitionProperty: 'background-color, border-color',
  transitionDuration: '150ms',
  selectors: {
    '&:hover:not(:disabled)': { background: brand.color.surfaceAlt, borderColor: brand.color.ink400 },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
    '&:disabled': { color: brand.color.ink400, cursor: 'default' },
  },
  '@media': { '(prefers-reduced-motion: reduce)': { transitionDuration: '0.01ms' } },
})
