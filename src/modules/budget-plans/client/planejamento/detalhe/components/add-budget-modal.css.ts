/**
 * Estilos do modal "Adicionar Orçamento" (HANDBOOK §1.6) — overlay + cartão centralizado, campo Estado,
 * footer Adicionar/Cancelar. Só tokens (§X); espelha o chrome do modal "Adicionar Plano".
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

export const overlay = style({
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: brand.space.lg,
  background: vars.color.institutional.overlay,
  zIndex: 50,
})

export const modal = style({
  display: 'flex',
  flexDirection: 'column',
  inlineSize: '100%',
  maxInlineSize: '26rem',
  maxBlockSize: '90vh',
  overflowY: 'auto',
  borderRadius: brand.radius.lg,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: brand.color.surface,
  boxShadow: vars.shadow.cardElevated,
  fontFamily: vars.font.family.heading, // Inter
})

export const head = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: brand.space.md,
  padding: brand.space.xl,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line}`,
})

export const title = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.panelTitle,
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
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
  color: brand.color.ink500,
  fontSize: vars.font.size.lg,
  lineHeight: 1,
  cursor: 'pointer',
  borderRadius: brand.radius.sm,
  selectors: {
    '&:hover': { background: brand.color.surfaceAlt, color: brand.color.ink900 },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const body = style({
  display: 'flex',
  flexDirection: 'column',
  gap: brand.space.md,
  padding: brand.space.xl,
})

export const field = style({ display: 'flex', flexDirection: 'column', gap: brand.space.xs })

export const label = style({
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.label,
  fontWeight: brand.weight.semibold,
  color: brand.color.ink700,
})

const CHEVRON_SVG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7480' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")"

export const select = style({
  blockSize: brand.size.field,
  paddingInlineStart: brand.space.md,
  paddingInlineEnd: brand.space.xxl,
  borderRadius: brand.radius.sm,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: `${brand.color.surface} ${CHEVRON_SVG} no-repeat`,
  backgroundPosition: `right ${brand.space.md} center`,
  appearance: 'none',
  color: brand.color.ink900,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.body,
  cursor: 'pointer',
  selectors: {
    '&:hover': { borderColor: brand.color.lineStrong },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const errorText = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.hint,
  color: vars.color.feedback.errorText,
})

export const foot = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: brand.space.sm,
  padding: brand.space.xl,
  borderBlockStart: `${vars.borderWidth.thin} solid ${brand.color.line}`,
})

const buttonBase = style({
  paddingBlock: brand.space.sm,
  paddingInline: brand.space.lg,
  borderRadius: brand.radius.sm,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.body,
  fontWeight: brand.weight.semibold,
  cursor: 'pointer',
  selectors: {
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const cancelButton = style([
  buttonBase,
  {
    border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
    background: brand.color.surface,
    color: brand.color.ink700,
    selectors: { '&:hover': { background: brand.color.surfaceAlt, borderColor: brand.color.ink400 } },
  },
])

export const addButton = style([
  buttonBase,
  {
    border: 'none',
    background: brand.color.primary,
    color: brand.color.surface,
    boxShadow: brand.shadow.btn,
    selectors: { '&:hover': { background: brand.color.primaryHover } },
  },
])
