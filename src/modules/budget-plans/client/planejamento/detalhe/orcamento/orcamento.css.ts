/**
 * Layout da EDIÇÃO de Orçamento (US2.4): cabeçalho (voltar + breadcrumb), linha de título ("{plano} >
 * {estado}" + Total Orçamento), barra de ações (Centro de Custo + Filtrar | Descartar/Salvar/…),
 * cabeçalho da seção (centro + ‹ › + Calcular Gasto) e o grid CATEGORIAS×meses. Só tokens (§X).
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

import { row, childRow } from '../components/consolidated-matrix.css.ts'

export const screen = style({
  padding: vars.space.xl,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
  blockSize: '100%',
  overflowY: 'auto',
  fontFamily: vars.font.family.body,
})

export const header = style({ display: 'flex', alignItems: 'center', gap: vars.space.sm })

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

export const card = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
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
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.xl,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
})

export const totalBudget = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.md,
  color: vars.color.nav.background,
})

export const totalValue = style({ fontWeight: vars.font.weight.bold, fontVariantNumeric: 'tabular-nums' })

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

export const filterGroup = style({ display: 'flex', alignItems: 'center', gap: vars.space.sm })

export const centroSelect = style({
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.primary,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  minInlineSize: '12rem',
  cursor: 'pointer',
})

const buttonBase = {
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
    '&:hover:not(:disabled)': { background: vars.color.surface.subtle },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
} as const

export const filterButton = style(buttonBase)
export const discardButton = style([buttonBase, { border: 'none', background: 'transparent' }])
export const moreButton = style([
  buttonBase,
  { paddingInline: vars.space.md, fontSize: vars.font.size.lg, lineHeight: 1 },
])

export const actionsRight = style({ display: 'flex', alignItems: 'center', gap: vars.space.sm })

// Botão de ação primário (Salvar / Calcular Gasto) — cyan da marca (§X).
const primaryBase = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.xs,
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.lg,
  borderRadius: vars.radius.md,
  border: 'none',
  background: vars.color.brand.normal,
  color: vars.color.brand.onBrand,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  selectors: {
    '&:hover': { background: vars.color.brand.hover },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
} as const

export const saveButton = style(primaryBase)
export const calcGastoButton = style(primaryBase)

export const sectionHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.md,
  flexWrap: 'wrap',
})

export const centroTitle = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
})

export const controls = style({ display: 'flex', alignItems: 'center', gap: vars.space.sm })

export const navButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '2rem',
  blockSize: '2rem',
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.primary,
  fontSize: vars.font.size.lg,
  lineHeight: 1,
  cursor: 'pointer',
  selectors: {
    '&:hover:not(:disabled)': { background: vars.color.surface.subtle },
    '&:disabled': { opacity: 0.4, cursor: 'not-allowed' },
  },
})

// Ícone de calculadora por linha (aparece no hover da linha) — abre "Calculando Gastos" (2.4b).
export const calcButton = style({
  marginInlineStart: 'auto',
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '1.75rem',
  blockSize: '1.75rem',
  borderRadius: vars.radius.sm,
  border: 'none',
  background: vars.color.brand.normal,
  color: vars.color.brand.onBrand,
  cursor: 'pointer',
  opacity: 0,
  transition: 'opacity 150ms ease, background 150ms ease',
  selectors: {
    [`${row}:hover &, ${childRow}:hover &`]: { opacity: 1 },
    '&:hover': { background: vars.color.brand.hover },
    '&:focus-visible': {
      opacity: 1,
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

// Linha-filha clicável (abre "Calculando Gastos").
export const clickableRow = style({ cursor: 'pointer' })

export const notFound = style({
  padding: vars.space.xl,
  textAlign: 'center',
  color: vars.color.text.secondary,
  fontFamily: vars.font.family.body,
})
