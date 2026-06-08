import { style, styleVariants } from '@vanilla-extract/css'

import { vars } from '../../tokens/index.ts'

/**
 * Estilos do DataTable — vanilla-extract, SÓ `vars.*` (lint só-tokens). Larguras de coluna
 * usam `rem` (a regra só-tokens proíbe cor/`px` crus, não `rem`; não há token de largura de
 * coluna — escala semântica narrow/normal/wide).
 */

// Container: borda sutil + raio + rolagem horizontal em viewport estreito.
export const container = style({
  inlineSize: '100%',
  overflowX: 'auto',
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.lg,
  background: vars.color.surface.default,
})

export const table = style({
  inlineSize: '100%',
  borderCollapse: 'collapse',
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
})

const cellBase = style({
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.md,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  textAlign: 'start',
  verticalAlign: 'middle',
})

export const th = style([
  cellBase,
  {
    position: 'sticky',
    insetBlockStart: 0,
    // Linha dos títulos com preenchimento discreto no tom da marca (cyan claro), nomes em índigo.
    background: vars.color.surface.canvas,
    color: vars.color.nav.background,
    fontWeight: vars.font.weight.semibold,
    whiteSpace: 'nowrap',
  },
])

export const td = style([cellBase])

// Última linha sem borda inferior (estética).
export const lastRowFlush = style({
  selectors: { [`${table} tbody tr:last-child &`]: { borderBlockEnd: 'none' } },
})

export const align = styleVariants({
  start: { textAlign: 'start' },
  center: { textAlign: 'center' },
  end: { textAlign: 'end' },
})

// Larguras semânticas (rem permitido pela regra só-tokens). `normal` deixa o layout decidir.
export const width = styleVariants({
  narrow: { inlineSize: '8rem' },
  normal: {},
  wide: { inlineSize: '20rem' },
})

// Célula de estado (loading/empty/error) ocupando a tabela inteira (colSpan).
export const stateCell = style([
  cellBase,
  {
    textAlign: 'center',
    color: vars.color.text.muted,
    paddingBlock: vars.space.xl,
  },
])

export const errorCell = style([
  stateCell,
  {
    color: vars.color.feedback.errorText,
    background: vars.color.feedback.errorBg,
  },
])
