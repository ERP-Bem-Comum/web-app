/**
 * Estilos de FILTRO reutilizáveis da identidade "brand" (mock colaboradores-filtros): toolbar (funil, busca,
 * "N filtros aplicados", segmento Todos/Ativos/Inativos), chips de filtro aplicado (âmbar) e o painel avançado
 * inteiro (cabeçalho, grupos, campos, footer). Cada grid faz `export * from` este arquivo no seu `*-filters.css.ts`.
 * Self-contained (não depende do shared/filters.css.ts dos parceiros).
 */
import { style, globalStyle } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

import { brand } from './grid-brand.values.ts'

// ── Toolbar ──
export const toolbar = style({
  display: 'flex',
  flexDirection: 'column',
  gap: brand.space.sm,
  marginBlockEnd: brand.space.md,
})
export const toolbarRow = style({ display: 'flex', alignItems: 'center', gap: brand.space.sm })

const funnelBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: brand.size.iconBtn,
  blockSize: brand.size.iconBtn,
  flexShrink: 0,
  borderRadius: brand.radius.sm,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: brand.color.surface,
  color: brand.color.ink500,
  cursor: 'pointer',
  selectors: {
    '&:hover': { borderColor: brand.color.ink400, color: brand.color.ink700 },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})
export const funnelButton = style([funnelBase])
export const funnelButtonActive = style([
  funnelBase,
  {
    border: 'none',
    background: brand.color.primary,
    color: brand.color.surface,
    boxShadow: brand.shadow.btn,
    selectors: { '&:hover': { background: brand.color.primaryHover, color: brand.color.surface } },
  },
])

export const search = style({ flex: '1 1 16rem', minInlineSize: '12rem' })
globalStyle(`${search} input`, {
  blockSize: brand.size.searchH,
  borderRadius: brand.radius.sm,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: brand.color.surface,
  color: brand.color.ink700,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.body,
})
globalStyle(`${search} input:focus, ${search} input:focus-visible`, {
  outline: 'none',
  borderColor: brand.color.primary,
  boxShadow: brand.shadow.focus,
})
globalStyle(`${search} input::placeholder`, { color: brand.color.ink400 })

export const counterChip = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: brand.space.sm,
  blockSize: brand.size.ctrlH,
  paddingInline: brand.space.lg,
  borderRadius: brand.radius.sm,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: brand.color.surface,
  color: brand.color.ink700,
  fontFamily: vars.font.family.heading,
  fontWeight: brand.weight.semibold,
  fontSize: brand.text.dd,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
})

export const group = style({
  display: 'inline-flex',
  alignItems: 'center',
  blockSize: brand.size.ctrlH,
  background: brand.color.surfaceAlt,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  borderRadius: brand.radius.sm,
  padding: brand.size.segPad,
})
const chipBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  blockSize: '100%',
  border: 'none',
  background: 'transparent',
  paddingInline: brand.size.segPadInline,
  borderRadius: brand.radius.xs,
  fontFamily: vars.font.family.heading,
  fontWeight: brand.weight.semibold,
  fontSize: brand.text.seg,
  color: brand.color.ink500,
  cursor: 'pointer',
  transition: `background ${brand.ease}, color ${brand.ease}`,
})
export const chip = style([chipBase])
export const chipActive = style([
  chipBase,
  { background: brand.color.surface, color: brand.color.primary, boxShadow: brand.shadow.btn },
])

// ── Chips de filtro aplicado ──
// A FORMA fica na base (sem cor); a COR vem por grid (cada tipo usa a sua — Fornecedor azul, Financiador
// verde, ACT laranja). O default exportado é o âmbar (Colaboradores). Cada `*-filters.css.ts` de parceiro
// sobrescreve `appliedChip`/`appliedChipRemove` com `partnerType.*`.
export const appliedChipBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: brand.space.sm,
  blockSize: brand.size.chipH,
  paddingInlineStart: brand.space.md,
  paddingInlineEnd: brand.space.xs,
  borderRadius: brand.radius.pill,
  border: `${vars.borderWidth.thin} solid transparent`,
  fontFamily: vars.font.family.heading,
  fontWeight: brand.weight.semibold,
  fontSize: brand.text.appliedChip,
  whiteSpace: 'nowrap',
})
export const appliedChip = style([
  appliedChipBase,
  { background: brand.color.chipBg, borderColor: brand.color.chipBorder, color: brand.color.chipFg },
])

export const appliedChipRemoveBase = style({
  display: 'grid',
  placeItems: 'center',
  inlineSize: brand.size.chipRemove,
  blockSize: brand.size.chipRemove,
  border: 'none',
  background: 'transparent',
  borderRadius: '50%',
  opacity: 0.7,
  cursor: 'pointer',
  transition: `opacity ${brand.ease}`,
  selectors: { '&:hover': { opacity: 1 } },
})
export const appliedChipRemove = style([appliedChipRemoveBase, { color: brand.color.chipFg }])
export const chipsRow = style({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: brand.space.sm,
})
export const chipsSpacer = style({
  inlineSize: vars.borderWidth.thin,
  blockSize: '1rem',
  background: brand.color.line,
  marginInline: brand.space.xs,
})
export const clearAllButton = style({
  border: 'none',
  background: 'transparent',
  color: brand.color.ink700,
  fontFamily: vars.font.family.heading,
  fontWeight: brand.weight.bold,
  fontSize: brand.text.body,
  cursor: 'pointer',
  selectors: { '&:hover': { color: brand.color.primary } },
})

// ── Painel avançado ──
export const panel = style({
  background: brand.color.panelBg,
  border: `${vars.borderWidth.thin} solid ${brand.color.panelBorder}`,
  borderRadius: brand.radius.lg,
  paddingBlock: brand.space.xl,
  paddingInline: brand.space.panelInl,
  display: 'flex',
  flexDirection: 'column',
  gap: brand.space.md,
})
export const advancedHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.md,
  marginBlockEnd: brand.space.sm,
})
export const funnelBadge = style({
  display: 'grid',
  placeItems: 'center',
  inlineSize: brand.size.iconBox,
  blockSize: brand.size.iconBox,
  flexShrink: 0,
  borderRadius: brand.radius.icon,
  background: brand.color.surface,
  border: `${vars.borderWidth.thin} solid ${brand.color.panelBorder}`,
  color: brand.color.primary,
})
export const headerTexts = style({
  display: 'flex',
  flexDirection: 'column',
  gap: brand.space.xxs,
  minInlineSize: 0,
  marginInlineEnd: 'auto',
})
export const advancedTitle = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.panelTitle,
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
})
export const advancedSubtitle = style({ margin: 0, fontSize: brand.text.panelSub, color: brand.color.ink500 })
export const collapseButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: brand.space.xs,
  border: 'none',
  background: 'transparent',
  color: brand.color.primary,
  fontFamily: vars.font.family.heading,
  fontWeight: brand.weight.semibold,
  fontSize: brand.text.body,
  cursor: 'pointer',
  flexShrink: 0,
})
export const groupSection = style({ display: 'flex', flexDirection: 'column', gap: brand.space.sm })
export const groupHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.sm,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.group,
  fontWeight: brand.weight.bold,
  color: brand.color.groupFg,
})
export const groupGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  columnGap: brand.space.gridCol,
  rowGap: brand.space.gridRow,
  alignItems: 'end',
  '@media': { '(min-width: 64rem)': { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' } },
})
export const field = style({
  display: 'flex',
  flexDirection: 'column',
  gap: brand.space.xs,
  minInlineSize: 0,
})
export const fieldLabel = style({
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.label,
  fontWeight: brand.weight.semibold,
  color: brand.color.ink700,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})
export const select = style({
  blockSize: brand.size.ctrlH,
  paddingInline: brand.space.md,
  borderRadius: brand.radius.sm,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: brand.color.surface,
  color: brand.color.ink700,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.body,
  inlineSize: '100%',
  cursor: 'pointer',
  selectors: {
    '&:focus': { outline: 'none', borderColor: brand.color.primary, boxShadow: brand.shadow.focus },
    '&:focus-visible': { outline: 'none', borderColor: brand.color.primary, boxShadow: brand.shadow.focus },
    '&:disabled': { background: brand.color.surfaceAlt, color: brand.color.ink400, cursor: 'not-allowed' },
  },
})
// Inputs do painel (átomo Input) — a borda vive no próprio <input>; sobrescrevo por descendente.
globalStyle(`${panel} input`, {
  blockSize: brand.size.ctrlH,
  borderRadius: brand.radius.sm,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: brand.color.surface,
  color: brand.color.ink900,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.body,
})
globalStyle(`${panel} input:focus, ${panel} input:focus-visible`, {
  outline: 'none',
  borderColor: brand.color.primary,
  boxShadow: brand.shadow.focus,
})
globalStyle(`${panel} input::placeholder`, { color: brand.color.ink400 })

export const panelFooter = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: brand.space.sm,
  marginBlockStart: brand.space.xs,
})
export const footerRight = style({ display: 'flex', alignItems: 'center', gap: brand.space.sm })

const footerButtonBase = style({
  blockSize: brand.size.ctrlH,
  paddingInline: vars.space.md,
  borderRadius: brand.radius.sm,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.body,
  fontWeight: brand.weight.semibold,
  cursor: 'pointer',
})
export const applyButton = style([
  footerButtonBase,
  {
    border: 'none',
    background: brand.color.primary,
    color: brand.color.surface,
    selectors: { '&:hover': { background: brand.color.primaryHover } },
  },
])
export const clearButton = style([
  footerButtonBase,
  {
    border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
    background: brand.color.surface,
    color: brand.color.ink700,
    selectors: { '&:hover': { background: brand.color.surfaceAlt, borderColor: brand.color.ink400 } },
  },
])
export const exportTrigger = style([
  footerButtonBase,
  {
    display: 'inline-flex',
    alignItems: 'center',
    border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
    background: brand.color.surface,
    color: brand.color.ink700,
    selectors: { '&:hover': { background: brand.color.surfaceAlt, borderColor: brand.color.ink400 } },
  },
])

/**
 * Linha do filtro de PERÍODO: dois campos de data lado a lado (De / Até). Vive na kit porque o período por
 * intervalo é padrão dos relatórios — antes cada page redeclarava o seu (`periodRow` em posicao/fluxo/geral).
 */
export const periodRow = style({ display: 'flex', gap: brand.space.sm, alignItems: 'flex-end' })

/** Campo de data com a MESMA pele do `select`, sem o chevron (é campo de texto, não dropdown). */
export const dateInput = style([
  select,
  { minInlineSize: '8.5rem', paddingInlineEnd: brand.space.md, cursor: 'text' },
])
