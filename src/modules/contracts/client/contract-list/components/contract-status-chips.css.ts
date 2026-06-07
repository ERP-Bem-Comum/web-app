import { style, styleVariants } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

// Container dos chips — fundo quente com micro-padding (2px = 0.125rem).
export const container = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.125rem',
  padding: '0.125rem',
  background: vars.color.institutional.paperWarm,
  borderRadius: vars.radius.md,
  minWidth: 0,
  overflowX: 'auto',
})

// Base compartilhada de cada chip.
const chipBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  blockSize: '1.875rem',
  paddingInline: '0.625rem',
  borderRadius: vars.radius.sm,
  fontFamily: vars.font.family.body,
  fontSize: '0.6875rem',
  fontWeight: vars.font.weight.semibold,
  lineHeight: 1,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  border: 'none',
  background: 'transparent',
  transition: 'background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease',
})

// Shadow composto com borda sutil (paperRule) + drop discreto. O rgba é funcional
// (opacidade de 4%) e não há token equivalente; o px cru é inevitável em offsets de
// shadow que não existem no design system — desabilitado por linha (T009).
// eslint-disable-next-line no-restricted-syntax
const activeShadow = `0 0 0 1px ${vars.color.institutional.paperRule}, 0 1px 2px rgba(0,0,0,0.04)`

export const chipState = styleVariants({
  normalActive: [
    chipBase,
    {
      background: vars.color.surface.default,
      color: vars.color.institutional.ink2,
      boxShadow: activeShadow,
    },
  ],
  normalInactive: [
    chipBase,
    {
      color: vars.color.institutional.ink4,
      ':hover': {
        background: vars.color.surface.default,
        color: vars.color.institutional.ink2,
        boxShadow: activeShadow,
      },
    },
  ],
  vencendoActive: [
    chipBase,
    {
      background: vars.color.status.escopoBg,
      color: vars.color.status.escopoText,
      boxShadow: activeShadow,
    },
  ],
  vencendoInactive: [
    chipBase,
    {
      color: vars.color.institutional.ink4,
      ':hover': {
        background: vars.color.status.escopoBg,
        color: vars.color.status.escopoText,
        boxShadow: activeShadow,
      },
    },
  ],
})

// Badge de contador — base compartilhada.
const badgeBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: vars.font.family.mono,
  fontSize: '0.59375rem',
  fontWeight: vars.font.weight.medium,
  borderRadius: vars.radius.sm,
  minInlineSize: '1rem',
  blockSize: '1rem',
  paddingInline: '0.25rem',
})

export const badge = styleVariants({
  active: [
    badgeBase,
    {
      color: vars.color.institutional.ink2,
      background: vars.color.institutional.paperBeige,
    },
  ],
  inactive: [
    badgeBase,
    {
      color: vars.color.institutional.ink5,
      background: vars.color.institutional.paperWarm,
    },
  ],
})
