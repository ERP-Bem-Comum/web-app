/**
 * Layout da página Detalhe do plano (HANDBOOK §1.4): cabeçalho (voltar + breadcrumb), linha de título
 * (nome + status + Total Plano), barra de ações e a matriz consolidada. Só tokens (§X).
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const screen = style({
  padding: vars.space.xl,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
  blockSize: '100%',
  overflowY: 'auto',
  fontFamily: vars.font.family.body,
})

export const header = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
})

export const backButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '2rem',
  blockSize: '2rem',
  flexShrink: 0,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.primary,
  cursor: 'pointer',
  // seta "voltar" = chevron rotacionado (‹). Reaproveita o ícone ChevronUp.
  transform: 'rotate(-90deg)',
  selectors: {
    '&:hover': { background: vars.color.surface.subtle },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const breadcrumb = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
})

// Card do RESULTADO (título + status + Total Plano) — reproduz o card do Consolidado: branco, borda leve.
export const resultCard = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  padding: vars.space.lg,
  borderRadius: vars.radius.lg,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  background: vars.color.surface.default,
})

export const titleRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.md,
  flexWrap: 'wrap',
})

export const title = style({
  margin: 0,
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.sm,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.xl,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
})

// "Total Plano:" — rótulo pequeno e cinza + valor em AZUL de marca grande (mesmo padrão do Consolidado).
export const totalPlan = style({
  display: 'inline-flex',
  alignItems: 'baseline',
  gap: vars.space.xs,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
})

export const totalValue = style({
  fontSize: vars.font.size.xl,
  fontWeight: vars.font.weight.bold,
  color: vars.color.brand.normal,
  fontVariantNumeric: 'tabular-nums',
})

// Barra de filtros/ações — cinza clara SEM borda (removida a pedido; espelha a barra do Orçamento).
export const actionBar = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.md,
  flexWrap: 'wrap',
  padding: vars.space.md,
  borderRadius: vars.radius.md,
  background: vars.color.surface.subtle,
})

export const filterGroup = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
})

const selectBase = {
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.secondary,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  minInlineSize: '8rem',
  cursor: 'pointer',
  selectors: {
    '&:disabled': { opacity: 0.55, cursor: 'not-allowed', background: vars.color.surface.subtle },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
} as const

export const stateSelect = style(selectBase)
export const municipioSelect = style(selectBase)

const buttonBase = style({
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.lg,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.primary,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  selectors: {
    '&:disabled': { opacity: 0.55, cursor: 'not-allowed' },
    '&:hover:not(:disabled)': { background: vars.color.surface.subtle },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const filterButton = style([buttonBase])
export const secondaryButton = style([buttonBase])

export const actionsRight = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
})

export const moreButton = style([
  buttonBase,
  { paddingInline: vars.space.md, fontSize: vars.font.size.lg, lineHeight: 1 },
])

export const notFound = style({
  padding: vars.space.xl,
  textAlign: 'center',
  color: vars.color.text.secondary,
  fontFamily: vars.font.family.body,
})
