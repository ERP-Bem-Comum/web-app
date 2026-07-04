/**
 * Layout da página Detalhe do plano (HANDBOOK §1.4) no padrão visual "brand" (espelha o `screen`/cabeçalho
 * de `planejamento-list`): container full-bleed com fundo cinza + rolagem própria (Inter), cabeçalho com
 * botão voltar + título/legenda, card do resultado (surface + borda line + sombra), barra de filtros/ações
 * com selects/botões brand e o valor "Total Plano" em azul da marca. Só tokens/values (§X).
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

// BLOCO (não flex column): os filhos ficam em fluxo de bloco → o `screen` ROLA de verdade (espelha o grid).
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

// Título "brand" (h1): Inter 22px 700 ink900.
export const headTitle = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.h1,
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
  letterSpacing: '-.01em',
})

// Legenda/breadcrumb — 13.5px ink400.
export const breadcrumb = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.subtitle,
  color: brand.color.ink400,
})

// Card do RESULTADO (título + status + Total Plano) — surface + borda line + sombra brand + radius lg.
export const resultCard = style({
  display: 'flex',
  flexDirection: 'column',
  gap: brand.space.md,
  padding: brand.space.xl,
  borderRadius: brand.radius.lg,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: brand.color.surface,
  boxShadow: brand.shadow.card,
  marginBlockEnd: brand.space.xl,
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
  display: 'inline-flex',
  alignItems: 'center',
  gap: brand.space.sm,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.h1,
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
  letterSpacing: '-.01em',
})

// "Total Plano:" — rótulo pequeno e cinza + valor em AZUL de marca grande.
export const totalPlan = style({
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

// Barra de filtros/ações — surface com borda line + radius, sombra sutil.
export const actionBar = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: brand.space.md,
  flexWrap: 'wrap',
  padding: brand.space.md,
  borderRadius: brand.radius.md,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: brand.color.surface,
  boxShadow: brand.shadow.card,
  marginBlockEnd: brand.space.xl,
})

export const filterGroup = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.sm,
})

// Select brand: 44px, appearance:none + chevron (data-uri), borda line.
const CHEVRON_SVG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7480' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")"

const selectBase = {
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
  minInlineSize: '9rem',
  cursor: 'pointer',
  selectors: {
    '&:disabled': { opacity: 0.55, cursor: 'not-allowed', background: brand.color.surfaceAlt },
    '&:hover:not(:disabled)': { borderColor: brand.color.lineStrong },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
} as const

export const stateSelect = style(selectBase)
export const municipioSelect = style(selectBase)

// Botão base (altura de controle brand).
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

// Ghost brand (borda line, surface, hover surfaceAlt) — secundários.
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
export const filterButton = style([
  controlButton,
  {
    border: 'none',
    background: brand.color.primary,
    color: brand.color.surface,
    boxShadow: brand.shadow.btn,
    selectors: { '&:hover:not(:disabled)': { background: brand.color.primaryHover } },
  },
])

export const secondaryButton = style([ghostButton])

export const actionsRight = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.sm,
})

export const moreButton = style([
  ghostButton,
  { paddingInline: brand.space.md, fontSize: brand.text.h1, lineHeight: 1 },
])

export const notFound = style({
  padding: brand.space.xxl,
  textAlign: 'center',
  color: brand.color.ink500,
  fontFamily: vars.font.family.heading,
})
