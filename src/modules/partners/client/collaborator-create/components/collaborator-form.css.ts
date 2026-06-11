import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const form = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xl,
  // Card mais largo: aproveita melhor a largura da página (layout de até 4 colunas).
  maxInlineSize: '72rem',
})

// Card: borda discreta + elevação. Sem padding aqui (header e body têm o seu); overflow hidden p/
// o header preencher até a borda arredondada.
export const section = style({
  borderRadius: vars.radius.lg,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  background: vars.color.surface.default,
  boxShadow: vars.shadow.card,
  overflow: 'hidden',
})

// Faixa de título com preenchimento discreto (tom de marca, igual à linha de títulos da tabela).
export const sectionHeader = style({
  paddingBlock: vars.space.md,
  paddingInline: vars.space.lg,
  background: vars.color.surface.canvas,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
})

// Corpo branco (campos sobre branco).
export const sectionBody = style({
  padding: vars.space.lg,
  background: vars.color.surface.default,
  containerType: 'inline-size',
})

export const sectionTitle = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.nav.background,
})

export const grid = style({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: vars.space.md,
  // mobile-first: 1 col → 2 col → 4 col (card largo), espelhando o print.
  '@container': {
    '(inline-size > 32rem)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
    '(inline-size > 56rem)': { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' },
  },
})

export const select = style({
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.primary,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  inlineSize: '100%',
})

export const errorBanner = style({
  padding: vars.space.md,
  borderRadius: vars.radius.md,
  background: vars.color.feedback.errorBg,
  color: vars.color.feedback.errorText,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
})

export const footer = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: vars.space.md,
})

export const cancelButton = style({
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.lg,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.primary,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  cursor: 'pointer',
  transitionProperty: 'background-color',
  transitionDuration: '150ms',
  selectors: {
    '&:hover': { background: vars.color.surface.subtle },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
  '@media': {
    '(prefers-reduced-motion: reduce)': { transitionDuration: '0.01ms' },
  },
})

export const saveWrap = style({
  inlineSize: '12rem',
})
