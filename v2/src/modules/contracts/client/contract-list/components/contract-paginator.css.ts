import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

/**
 * Estilos do ContractPaginator — paginador burro da lista de contratos.
 * Fidelidade v1: tipografia mono compacta, cores institucionais, bordas paperRule.
 */

export const container = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  fontSize: '0.71875rem',
  color: vars.color.institutional.ink4,
  fontFamily: vars.font.family.body,
})

export const rangeInfo = style({
  fontFamily: vars.font.family.mono,
  fontSize: '0.6875rem',
  fontWeight: vars.font.weight.medium,
  color: vars.color.institutional.ink2,
})

export const separator = style({
  color: vars.color.institutional.paperRule,
  userSelect: 'none',
})

export const select = style({
  blockSize: '1.625rem',
  paddingInline: vars.space.xs,
  fontFamily: vars.font.family.mono,
  fontSize: '0.6875rem',
  borderRadius: vars.radius.sm,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  background: vars.color.surface.default,
  color: vars.color.institutional.ink2,
  cursor: 'pointer',
  outline: 'none',
  ':focus': {
    borderColor: vars.color.institutional.blueLine,
  },
})

export const perPageLabel = style({
  fontSize: '0.6875rem',
  color: vars.color.institutional.ink5,
  fontFamily: vars.font.family.body,
})

export const navGroup = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.125rem',
  marginLeft: vars.space.sm,
  paddingLeft: vars.space.md,
  borderLeft: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
})

export const navButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '1.625rem',
  blockSize: '1.625rem',
  borderRadius: vars.radius.sm,
  border: 'none',
  background: 'transparent',
  color: vars.color.institutional.ink4,
  fontSize: vars.font.size.md,
  lineHeight: 1,
  cursor: 'pointer',
  ':hover': {
    background: vars.color.institutional.paperWarm,
  },
  ':disabled': {
    color: vars.color.institutional.paperRule,
    cursor: 'not-allowed',
  },
})
