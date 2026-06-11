import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

// Pilha vertical de cards (mesmo padrão do detalhe de Colaboradores).
export const stack = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xl,
  maxInlineSize: '72rem',
})

// Card com faixa de título colada no topo. Sem padding no topo (a faixa cola).
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
  // não encolher dentro do screen com overflow (senão o overflow:hidden corta os campos).
  flexShrink: 0,
})

export const sectionTitle = style({
  margin: 0,
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

// Linha do badge de status — flex para o badge ficar com a largura natural (não esticar no card).
export const statusRow = style({
  display: 'flex',
})

export const fieldGrid = style({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: vars.space.md,
  '@container': {
    '(inline-size > 32rem)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
    '(inline-size > 56rem)': { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' },
  },
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
