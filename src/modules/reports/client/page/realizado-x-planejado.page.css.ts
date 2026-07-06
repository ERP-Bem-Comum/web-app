/**
 * Estilos da page "Realizado × Planejado" — reprodução fiel do mock `realizado-planejado-v2`
 * (identidade "brand", só-tokens §X). Cobre: cabeçalho (voltar + título + Filtros/Exportar), filtros
 * recolhíveis, os 4 KPIs, a grade dos 3 cartões de gráfico e o card da tabela (cabeçalho + passador de meses).
 * A matriz em si (thead/linhas/rodapé) tem seu `*.css.ts` próprio (`realizado-table.css.ts`).
 *
 * As custom-props do mock mapeiam para tokens da marca: --primary/--previsto = brand.color.primary;
 * --realizado/--provisionado/child-bg = brand.color.rxp.*; --page-bg = brand.color.pageBg; radii/shadow/ink/
 * line/surface = brand.*. Nenhum hex/px cru aqui.
 */
import { style, styleVariants } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

// ── Cabeçalho (voltar + título + ferramentas) ──
export const head = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.lg,
  marginBlockEnd: brand.space.gridRow,
})

export const backButton = style({
  inlineSize: brand.size.backBtn,
  blockSize: brand.size.backBtn,
  flexShrink: 0,
  display: 'grid',
  placeItems: 'center',
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: brand.color.surface,
  borderRadius: brand.radius.sm,
  color: brand.color.primary,
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

export const headTitle = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.h1,
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
  letterSpacing: '-.01em',
})

export const tools = style({
  marginInlineStart: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.sm,
})

// Botão "Filtros" (ghost). Estado ativo (.on) quando os filtros estão abertos.
const ghostBase = style({
  blockSize: brand.size.ctrlH,
  paddingInline: brand.space.gridCol,
  display: 'inline-flex',
  alignItems: 'center',
  gap: brand.space.sm,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  borderRadius: brand.radius.sm,
  background: brand.color.surface,
  color: brand.color.ink700,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.body,
  fontWeight: brand.weight.semibold,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: `all ${brand.ease}`,
  selectors: {
    '&:hover': { background: brand.color.surfaceAlt, borderColor: brand.color.lineStrong },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const filterToggle = style([
  ghostBase,
  {
    selectors: {
      '&[aria-pressed="true"]': {
        background: brand.color.cadBg,
        borderColor: brand.color.lineStrong,
        color: brand.color.primary,
      },
    },
  },
])

// ── Filtros recolhíveis (max-height/opacity animados) ──
export const filters = styleVariants({
  closed: {
    overflow: 'hidden',
    maxBlockSize: 0,
    opacity: 0,
    marginBlockEnd: 0,
    transition: 'max-height .25s ease, opacity .2s, margin .2s',
  },
  open: {
    overflow: 'hidden',
    maxBlockSize: '12.5rem',
    opacity: 1,
    marginBlockEnd: brand.space.gridRow,
    transition: 'max-height .25s ease, opacity .2s, margin .2s',
  },
})

export const filtersInner = style({
  display: 'flex',
  alignItems: 'flex-end',
  gap: brand.space.gridRow,
  flexWrap: 'wrap',
  background: brand.color.surface,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  borderRadius: brand.radius.lg,
  boxShadow: brand.shadow.card,
  padding: `${brand.space.gridRow} ${brand.space.gridCol}`,
})

export const fld = style({ display: 'flex', flexDirection: 'column', gap: brand.space.xs })
export const fldLabel = style({
  fontSize: brand.text.thead,
  fontWeight: brand.weight.semibold,
  letterSpacing: '.03em',
  textTransform: 'uppercase',
  color: brand.color.ink500,
})
export const fldCtrl = style({ position: 'relative' })
export const fldSelect = style({
  blockSize: brand.size.field,
  minInlineSize: '10rem',
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  borderRadius: brand.radius.sm,
  background: brand.color.surface,
  paddingInlineStart: brand.space.md,
  paddingInlineEnd: '2.125rem',
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.body,
  color: brand.color.ink700,
  appearance: 'none',
  cursor: 'pointer',
  transition: `all ${brand.ease}`,
  selectors: {
    '&:focus': {
      outline: 'none',
      borderColor: brand.color.primary,
      boxShadow: brand.shadow.focus,
    },
  },
})
export const fldChev = style({
  position: 'absolute',
  insetInlineEnd: brand.space.md,
  insetBlockStart: '50%',
  transform: 'translateY(-50%)',
  color: brand.color.ink400,
  pointerEvents: 'none',
})
export const applyButton = style({
  marginInlineStart: 'auto',
  blockSize: brand.size.field,
  paddingInline: brand.space.gridCol,
  border: 'none',
  borderRadius: brand.radius.sm,
  background: brand.color.primary,
  color: brand.color.surface,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.body,
  fontWeight: brand.weight.semibold,
  cursor: 'pointer',
  transition: `all ${brand.ease}`,
  selectors: {
    '&:hover': { background: brand.color.primaryHover },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

// ── Cartão genérico (KPI + gráfico + tabela) ──
export const card = style({
  background: brand.color.surface,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  borderRadius: brand.radius.lg,
  boxShadow: brand.shadow.card,
})

export const cardHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.md,
  paddingBlock: brand.space.gridRow,
  paddingInline: brand.space.gridCol,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line2}`,
})
export const cardTitle = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.sectionH2,
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
})
export const cardHint = style({
  marginInlineStart: 'auto',
  fontSize: brand.text.hint,
  color: brand.color.ink400,
})

// ── KPIs (4 colunas, barra colorida à esquerda) ──
export const kpis = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: brand.space.gridRow,
  marginBlockEnd: brand.space.gridRow,
  '@media': { 'screen and (max-width: 60rem)': { gridTemplateColumns: 'repeat(2, 1fr)' } },
})
export const kpi = style([
  card,
  {
    padding: `${brand.space.gridRow} ${brand.space.gridCol}`,
    position: 'relative',
    overflow: 'hidden',
    selectors: {
      '&::before': {
        content: '""',
        position: 'absolute',
        insetInlineStart: 0,
        insetBlockStart: 0,
        insetBlockEnd: 0,
        inlineSize: brand.rxp.kpiAccentWidth,
      },
    },
  },
])
// Barra de cor à esquerda por tipo de KPI.
export const kpiAccent = styleVariants({
  plan: { selectors: { [`${kpi}&::before`]: { background: brand.color.rxp.previsto } } },
  real: { selectors: { [`${kpi}&::before`]: { background: brand.color.rxp.realizado } } },
  prov: { selectors: { [`${kpi}&::before`]: { background: brand.color.rxp.provisionado } } },
  exec: { selectors: { [`${kpi}&::before`]: { background: brand.color.ink400 } } },
})
export const kpiLabel = style({
  fontSize: brand.text.hint,
  color: brand.color.ink500,
  fontWeight: brand.weight.semibold,
  textTransform: 'uppercase',
  letterSpacing: '.03em',
})
export const kpiValue = style({
  fontSize: '1.25rem',
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
  letterSpacing: '-.01em',
  marginBlockStart: brand.space.xs,
  fontVariantNumeric: 'tabular-nums',
})
export const kpiSub = style({
  fontSize: brand.text.hint,
  color: brand.color.ink400,
  marginBlockStart: brand.space.xxs,
})

// ── Grade dos 3 gráficos ──
export const charts3 = style({
  display: 'grid',
  // "Por centro de custo" (nomes longos) mais largo; donut mais estreito → nomes não cortam.
  gridTemplateColumns: '1.4fr 1.05fr 0.85fr',
  gap: brand.space.gridRow,
  marginBlockEnd: brand.space.gridRow,
  alignItems: 'stretch',
  '@media': { 'screen and (max-width: 75rem)': { gridTemplateColumns: '1fr' } },
})
export const chartCard = style([card, { display: 'flex', flexDirection: 'column' }])
export const chartPad = style({
  padding: `${brand.space.gridRow} ${brand.space.gridCol} ${brand.space.gridCol}`,
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
})

// ── Passador de meses (no header do card da tabela) ──
export const pager = style({
  marginInlineStart: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.sm,
})
export const pagerLabel = style({
  fontSize: brand.text.label,
  fontWeight: brand.weight.semibold,
  color: brand.color.ink700,
  fontVariantNumeric: 'tabular-nums',
})
export const pagerButton = style({
  inlineSize: brand.size.pagerHeight,
  blockSize: brand.size.pagerHeight,
  display: 'grid',
  placeItems: 'center',
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: brand.color.surface,
  borderRadius: brand.radius.sm,
  color: brand.color.ink500,
  cursor: 'pointer',
  transition: `all ${brand.ease}`,
  selectors: {
    '&:hover:not(:disabled)': { borderColor: brand.color.lineStrong, color: brand.color.ink700 },
    '&:disabled': { color: brand.color.ink400, opacity: 0.5, cursor: 'default' },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})
