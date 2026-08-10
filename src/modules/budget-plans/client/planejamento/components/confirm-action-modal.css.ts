/**
 * Estilos do modal de confirmação das ações do menu "…" (§2.5) e do toast de sucesso. Só tokens (§X).
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const overlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 70,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: vars.space.lg,
  background: vars.color.institutional.overlay,
})

export const dialog = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  inlineSize: '100%',
  maxInlineSize: '28rem',
  padding: vars.space.lg,
  borderRadius: vars.radius.lg,
  background: vars.color.surface.default,
  boxShadow: vars.shadow.cardElevated,
})

export const title = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.md,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
})

export const body = style({
  margin: 0,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
  lineHeight: 1.5,
})

export const field = style({ display: 'flex', flexDirection: 'column', gap: vars.space.xs })

export const label = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.secondary,
})

export const input = style({
  blockSize: '2.5rem',
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.primary,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
})

export const footer = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: vars.space.sm,
  marginBlockStart: vars.space.xs,
})

const buttonBase = style({
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.lg,
  borderRadius: vars.radius.md,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  cursor: 'pointer',
})

export const cancelButton = style([
  buttonBase,
  {
    border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
    background: vars.color.surface.default,
    color: vars.color.text.secondary,
  },
])

export const confirmButton = style([
  buttonBase,
  {
    border: 'none',
    background: vars.color.brand.normal,
    color: vars.color.brand.onBrand,
    selectors: { '&:hover': { background: vars.color.brand.hover } },
  },
])

export const confirmButtonDanger = style([
  buttonBase,
  {
    border: 'none',
    background: vars.color.feedback.errorText,
    color: vars.color.surface.default,
    selectors: { '&:hover': { opacity: 0.9 } },
  },
])

// ── Toast de sucesso (transitório) ──
export const toast = style({
  position: 'fixed',
  insetBlockEnd: vars.space.xl,
  insetInlineEnd: vars.space.xl,
  zIndex: 80,
  maxInlineSize: '24rem',
  paddingBlock: vars.space.md,
  paddingInline: vars.space.lg,
  borderRadius: vars.radius.md,
  background: vars.color.brand.normal,
  color: vars.color.brand.onBrand,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  boxShadow: vars.shadow.cardElevated,
})
