import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const stack = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xl,
  maxInlineSize: '72rem',
})

// Card com faixa de título (mesmo padrão dos forms de parceiro). Sem padding no topo (a faixa cola).
export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  paddingBlockStart: 0,
  paddingBlockEnd: vars.space.lg,
  paddingInline: vars.space.lg,
  borderRadius: vars.radius.lg,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  background: vars.color.surface.default,
  boxShadow: vars.shadow.card,
  overflow: 'hidden',
  containerType: 'inline-size',
  // não encolher dentro do flex-column da página (senão o overflow:hidden corta os campos
  // em vez de gerar o scroll do container .screen)
  flexShrink: 0,
})

export const sectionTitle = style({
  margin: 0,
  marginInline: `calc(-1 * ${vars.space.lg})`,
  paddingBlock: vars.space.md,
  paddingInline: vars.space.lg,
  background: vars.color.surface.subtle,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.md,
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

// Campo que ocupa a linha inteira (ex.: mini biografia).
export const gridFull = style({
  gridColumn: '1 / -1',
})

// Aviso de seção gated (espelha o form: dados bancários aguardando backend).
export const gatedNote = style({
  margin: 0,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
})

export const select = style({
  blockSize: '2.5rem',
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

export const textarea = style({
  inlineSize: '100%',
  boxSizing: 'border-box',
  minBlockSize: '4.5rem',
  padding: vars.space.sm,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.primary,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  resize: 'vertical',
  lineHeight: 1.45,
  selectors: {
    '&:disabled': {
      background: vars.color.surface.subtle,
      color: vars.color.text.muted,
      cursor: 'not-allowed',
    },
  },
})
