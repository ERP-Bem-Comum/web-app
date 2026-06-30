import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const card = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  // faixa de título cola no topo (sem padding superior); corpo leva o padding lateral/inferior.
  paddingBlockStart: 0,
  paddingBlockEnd: vars.space.lg,
  paddingInline: vars.space.lg,
  borderRadius: vars.radius.lg,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  background: vars.color.surface.default,
  boxShadow: vars.shadow.card,
  overflow: 'hidden',
  minBlockSize: 0,
})

// Faixa de título (mesmo padrão dos cards de Parceiros): vai até as bordas do card, tom de marca.
export const header = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: vars.space.sm,
  marginInline: `calc(-1 * ${vars.space.lg})`,
  paddingBlock: vars.space.md,
  paddingInline: vars.space.lg,
  background: vars.color.surface.subtle,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
})

export const title = style({
  margin: 0,
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.md,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.nav.background,
})

export const count = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.secondary,
})

export const tableHead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.sm,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: vars.color.nav.background,
})

export const list = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  maxBlockSize: '22rem',
  overflowY: 'auto',
  scrollbarWidth: 'thin',
  scrollbarColor: `${vars.color.border.default} transparent`,
})

export const row = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.sm,
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.sm,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
})

export const label = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
})

export const addedText = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.muted,
})

const actionBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '1.75rem',
  blockSize: '1.75rem',
  flexShrink: 0,
  borderRadius: '50%',
  background: vars.color.surface.default,
  cursor: 'pointer',
  transitionProperty: 'background-color, opacity',
  transitionDuration: '150ms',
  selectors: {
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
    '&:disabled': { opacity: '0.5', cursor: 'not-allowed' },
  },
  '@media': { '(prefers-reduced-motion: reduce)': { transitionDuration: '0.01ms' } },
})

export const addButton = style([
  actionBase,
  {
    border: `${vars.borderWidth.thin} solid ${vars.color.status.activeText}`,
    color: vars.color.status.activeText,
    selectors: { '&:hover:not(:disabled)': { background: vars.color.status.activeBg } },
  },
])

export const removeButton = style([
  actionBase,
  {
    border: `${vars.borderWidth.thin} solid ${vars.color.feedback.errorText}`,
    color: vars.color.feedback.errorText,
    selectors: { '&:hover:not(:disabled)': { background: vars.color.feedback.errorBg } },
  },
])

export const message = style({
  paddingBlock: vars.space.lg,
  paddingInline: vars.space.sm,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.muted,
})
