import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const form = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xl,
  // usa toda a largura disponível da tela (cap generoso só pra telas ultra-largas).
  inlineSize: '100%',
  maxInlineSize: '110rem',
  // não encolher dentro do screen com overflow.
  flexShrink: 0,
})

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  // título-faixa cola no topo; o corpo (campos) leva o padding lateral/inferior. Card com elevação.
  paddingBlockStart: 0,
  paddingBlockEnd: vars.space.lg,
  paddingInline: vars.space.lg,
  borderRadius: vars.radius.lg,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  background: vars.color.surface.default,
  boxShadow: vars.shadow.card,
  overflow: 'hidden',
  containerType: 'inline-size',
})

export const sectionTitle = style({
  margin: 0,
  // faixa de título: vai até as bordas do card (cancela o padding lateral) com preenchimento discreto
  // no tom de marca (igual à linha de títulos da tabela). Sem itens laranja.
  marginInline: `calc(-1 * ${vars.space.lg})`,
  paddingBlock: vars.space.md,
  paddingInline: vars.space.lg,
  background: vars.color.surface.canvas,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.nav.background,
})

export const grid = style({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: vars.space.md,
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
  selectors: {
    '&:disabled': {
      background: vars.color.surface.subtle,
      color: vars.color.text.muted,
      cursor: 'not-allowed',
    },
  },
})

export const errorBanner = style({
  padding: vars.space.md,
  borderRadius: vars.radius.md,
  background: vars.color.feedback.errorBg,
  color: vars.color.feedback.errorText,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
})

// Aviso da regra de repasse (quando "Sim"): dados bancários ficam obrigatórios.
export const hint = style({
  margin: 0,
  padding: vars.space.sm,
  borderRadius: vars.radius.md,
  background: vars.color.surface.canvas,
  color: vars.color.text.secondary,
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
