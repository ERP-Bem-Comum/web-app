/**
 * Layout da EDIÇÃO de Orçamento (US2.4) no padrão visual "brand": container full-bleed cinza + rolagem
 * própria (Inter), cabeçalho com botão voltar + título/legenda, card (surface + borda line + sombra),
 * barra de ações (Centro de Custo + Filtrar | Descartar/Salvar/…) com selects/botões brand, cabeçalho da
 * seção (centro + ‹ › + Calcular Gasto) e o grid CATEGORIAS×meses. Só tokens/values (§X).
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

import { row, childRow } from '../components/consolidated-matrix.css.ts'

export const screen = style({
  padding: brand.space.xxl,
  blockSize: '100%',
  overflowY: 'auto',
  background: brand.color.pageBg,
  fontFamily: vars.font.family.heading, // Inter
  color: brand.color.ink700,
  scrollbarWidth: 'thin',
  scrollbarColor: `${brand.color.scrollThumb} transparent`,
  selectors: {
    '&::-webkit-scrollbar': { inlineSize: '0.625rem' },
    '&::-webkit-scrollbar-thumb': { background: brand.color.scrollThumb, borderRadius: brand.radius.sm },
    '&::-webkit-scrollbar-track': { background: 'transparent' },
  },
})

// ── Cabeçalho brand: botão voltar (quadrado, borda line) + título/legenda ──
export const header = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.lg,
  marginBlockEnd: brand.space.xl,
})

export const backButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: brand.size.backBtn,
  blockSize: brand.size.backBtn,
  flexShrink: 0,
  borderRadius: brand.radius.md,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: brand.color.surface,
  color: brand.color.ink700,
  cursor: 'pointer',
  transition: `all ${brand.ease}`,
  selectors: {
    '&:hover': { background: brand.color.surfaceAlt, borderColor: brand.color.lineStrong },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const headText = style({ display: 'flex', flexDirection: 'column', gap: brand.space.xxs })

export const headTitle = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.h1,
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
  letterSpacing: '-.01em',
})

export const breadcrumb = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.subtitle,
  color: brand.color.ink400,
})

// Card — surface + borda line + sombra brand + radius lg.
export const card = style({
  display: 'flex',
  flexDirection: 'column',
  gap: brand.space.xl,
  padding: brand.space.xl,
  borderRadius: brand.radius.lg,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: brand.color.surface,
  boxShadow: brand.shadow.card,
})

export const titleRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: brand.space.md,
  flexWrap: 'wrap',
})

export const title = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.h1,
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
  letterSpacing: '-.01em',
})

// "Total Orçamento:" — rótulo pequeno cinza + valor azul de marca.
export const totalBudget = style({
  display: 'inline-flex',
  alignItems: 'baseline',
  gap: brand.space.xs,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.subtitle,
  color: brand.color.ink500,
})

export const totalValue = style({
  fontSize: brand.text.h1,
  fontWeight: brand.weight.bold,
  color: brand.color.primary,
  fontVariantNumeric: 'tabular-nums',
})

// Barra de ações — surfaceAlt com borda line + radius.
export const actionBar = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: brand.space.md,
  flexWrap: 'wrap',
  padding: brand.space.md,
  borderRadius: brand.radius.md,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: brand.color.surfaceAlt,
})

export const filterGroup = style({ display: 'flex', alignItems: 'center', gap: brand.space.sm })

const CHEVRON_SVG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7480' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")"

export const centroSelect = style({
  blockSize: brand.size.ctrlH,
  paddingInlineStart: brand.space.md,
  paddingInlineEnd: brand.space.xxl,
  borderRadius: brand.radius.sm,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: `${brand.color.surface} ${CHEVRON_SVG} no-repeat`,
  backgroundPosition: `right ${brand.space.md} center`,
  appearance: 'none',
  color: brand.color.ink700,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.body,
  minInlineSize: '13rem',
  cursor: 'pointer',
  selectors: {
    '&:hover': { borderColor: brand.color.lineStrong },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

const controlButton = style({
  blockSize: brand.size.ctrlH,
  display: 'inline-flex',
  alignItems: 'center',
  gap: brand.space.sm,
  paddingInline: brand.space.lg,
  borderRadius: brand.radius.sm,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.body,
  fontWeight: brand.weight.semibold,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  selectors: {
    '&:disabled': { opacity: 0.55, cursor: 'not-allowed' },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

const ghostButton = style([
  controlButton,
  {
    border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
    background: brand.color.surface,
    color: brand.color.ink700,
    selectors: {
      '&:hover:not(:disabled)': { background: brand.color.surfaceAlt, borderColor: brand.color.ink400 },
    },
  },
])

// Primário brand (azul da marca).
const primaryButton = style([
  controlButton,
  {
    border: 'none',
    background: brand.color.primary,
    color: brand.color.surface,
    boxShadow: brand.shadow.btn,
    selectors: { '&:hover:not(:disabled)': { background: brand.color.primaryHover } },
  },
])

export const filterButton = style([primaryButton])
export const discardButton = style([ghostButton])
export const moreButton = style([
  ghostButton,
  { paddingInline: brand.space.md, fontSize: brand.text.h1, lineHeight: 1 },
])

export const actionsRight = style({ display: 'flex', alignItems: 'center', gap: brand.space.sm })

export const saveButton = style([primaryButton])
export const calcGastoButton = style([primaryButton])

export const sectionHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: brand.space.md,
  flexWrap: 'wrap',
})

export const centroTitle = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.panelTitle,
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
})

export const controls = style({ display: 'flex', alignItems: 'center', gap: brand.space.sm })

// Nav prev/next — botões 44px borda line.
export const navButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: brand.size.ctrlH,
  blockSize: brand.size.ctrlH,
  borderRadius: brand.radius.sm,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: brand.color.surface,
  color: brand.color.ink500,
  fontSize: brand.text.h1,
  lineHeight: 1,
  cursor: 'pointer',
  transition: `all ${brand.ease}`,
  selectors: {
    '&:hover:not(:disabled)': { borderColor: brand.color.lineStrong, color: brand.color.ink700 },
    '&:disabled': { opacity: 0.4, cursor: 'not-allowed' },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
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
  borderRadius: brand.radius.xs,
  border: 'none',
  background: brand.color.primary,
  color: brand.color.surface,
  cursor: 'pointer',
  opacity: 0,
  transition: `opacity ${brand.ease}, background ${brand.ease}`,
  selectors: {
    [`${row}:hover &, ${childRow}:hover &`]: { opacity: 1 },
    '&:hover': { background: brand.color.primaryHover },
    '&:focus-visible': {
      opacity: 1,
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

// Linha-filha clicável (abre "Calculando Gastos").
export const clickableRow = style({ cursor: 'pointer' })

export const notFound = style({
  padding: brand.space.xxl,
  textAlign: 'center',
  color: brand.color.ink500,
  fontFamily: vars.font.family.heading,
})
