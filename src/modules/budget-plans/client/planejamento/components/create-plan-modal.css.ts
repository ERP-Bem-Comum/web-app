/**
 * Estilos do modal "Adicionar Plano Orçamentário" (HANDBOOK §1.2). Overlay + cartão centralizado, campos
 * (Ano, Programa, toggle "Importar dados" → "Criar a partir do ano de"), footer Adicionar/Cancelar. Só
 * tokens (§X). Espelha o padrão dos modais do financeiro (overlay/modal/footer).
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const overlay = style({
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: vars.space.lg,
  background: vars.color.institutional.overlay,
  zIndex: 50,
})

export const modal = style({
  display: 'flex',
  flexDirection: 'column',
  inlineSize: '100%',
  maxInlineSize: '28rem',
  maxBlockSize: '90vh',
  overflowY: 'auto',
  borderRadius: vars.radius.lg,
  background: vars.color.surface.default,
  boxShadow: vars.shadow.cardElevated,
})

export const head = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.md,
  padding: vars.space.lg,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
})

export const title = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
})

export const close = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '2rem',
  blockSize: '2rem',
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: vars.color.text.secondary,
  fontSize: vars.font.size.lg,
  lineHeight: 1,
  cursor: 'pointer',
  borderRadius: vars.radius.sm,
  selectors: {
    '&:hover': { background: vars.color.surface.subtle, color: vars.color.text.primary },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const body = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  padding: vars.space.lg,
})

export const field = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
})

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
  selectors: {
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const select = style([input])

export const toggleRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
})

export const toggleLabel = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
})

export const errorText = style({
  margin: 0,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.feedback.errorText,
})

export const foot = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: vars.space.sm,
  padding: vars.space.lg,
  borderBlockStart: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
})

const buttonBase = style({
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.lg,
  borderRadius: vars.radius.md,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  cursor: 'pointer',
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
})

export const cancelButton = style([
  buttonBase,
  { background: 'transparent', color: vars.color.text.secondary },
])

export const addButton = style([
  buttonBase,
  {
    background: vars.color.brand.normal,
    color: vars.color.brand.onBrand,
    borderColor: vars.color.brand.normal,
    selectors: { '&:hover': { background: vars.color.brand.hover, borderColor: vars.color.brand.hover } },
  },
])
