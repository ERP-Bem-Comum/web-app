/**
 * Estilos do filtro de Colaboradores = modelo compartilhado (`shared/filters.css.ts`) + OVERRIDES da nova
 * identidade "colaboradores-brand" (mocks colaboradores-brand + colaboradores-filtros): toolbar (funil,
 * busca, "N filtros aplicados", segmento), chips aplicados (âmbar) e o PAINEL avançado inteiro (cabeçalho,
 * grupos, campos, footer). Os overrides locais SHADOW os nomes do `export *` → só esta tela muda.
 */
import { style, globalStyle } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

import { collab } from '../collab-brand.values.ts'

export * from '#modules/partners/client/shared/filters.css.ts'

// ── Toolbar ──

/* Botão de filtro (funil) — icon-btn; ativo (painel aberto) = azul preenchido. */
const funnelBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: collab.size.iconBtn,
  blockSize: collab.size.iconBtn,
  flexShrink: 0,
  borderRadius: collab.radius.sm,
  border: `${vars.borderWidth.thin} solid ${collab.color.line}`,
  background: collab.color.surface,
  color: collab.color.ink500,
  cursor: 'pointer',
  selectors: {
    '&:hover': { borderColor: collab.color.ink400, color: collab.color.ink700 },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${collab.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})
export const funnelButton = style([funnelBase])
export const funnelButtonActive = style([
  funnelBase,
  {
    border: 'none',
    background: collab.color.primary,
    color: collab.color.surface,
    boxShadow: collab.shadow.btn,
    selectors: { '&:hover': { background: collab.color.primaryHover, color: collab.color.surface } },
  },
])

/* Campo de busca — a borda vive no <input> do átomo; sobrescrevo o descendente via globalStyle. */
export const search = style({ flex: '1 1 16rem', minInlineSize: '12rem' })

globalStyle(`${search} input`, {
  blockSize: collab.size.searchH,
  borderRadius: collab.radius.sm,
  border: `${vars.borderWidth.thin} solid ${collab.color.line}`,
  background: collab.color.surface,
  color: collab.color.ink700,
  fontFamily: vars.font.family.heading,
  fontSize: collab.text.body,
})
globalStyle(`${search} input:focus, ${search} input:focus-visible`, {
  outline: 'none',
  borderColor: collab.color.primary,
  boxShadow: collab.shadow.focus,
})
globalStyle(`${search} input::placeholder`, { color: collab.color.ink400 })

/* "N filtros aplicados" — dropdown (applied-dd). */
export const counterChip = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: collab.space.sm,
  blockSize: collab.size.ctrlH,
  paddingInline: collab.space.lg,
  borderRadius: collab.radius.sm,
  border: `${vars.borderWidth.thin} solid ${collab.color.line}`,
  background: collab.color.surface,
  color: collab.color.ink700,
  fontFamily: vars.font.family.heading,
  fontWeight: collab.weight.semibold,
  fontSize: collab.text.dd,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
})

/* Segmento Todos/Ativos/Inativos — altura 44px (alinha com busca / "N filtros aplicados"). */
export const group = style({
  display: 'inline-flex',
  alignItems: 'center',
  blockSize: collab.size.ctrlH,
  background: collab.color.surfaceAlt,
  border: `${vars.borderWidth.thin} solid ${collab.color.line}`,
  borderRadius: collab.radius.sm,
  padding: collab.size.segPad,
})

const chipBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  blockSize: '100%',
  border: 'none',
  background: 'transparent',
  paddingInline: collab.size.segPadInline,
  borderRadius: collab.radius.xs,
  fontFamily: vars.font.family.heading,
  fontWeight: collab.weight.semibold,
  fontSize: collab.text.seg,
  color: collab.color.ink500,
  cursor: 'pointer',
  transition: `background ${collab.ease}, color ${collab.ease}`,
})
export const chip = style([chipBase])
export const chipActive = style([
  chipBase,
  { background: collab.color.surface, color: collab.color.primary, boxShadow: collab.shadow.btn },
])

// ── Chips de filtro aplicado (âmbar) ──
export const appliedChip = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: collab.space.sm,
  blockSize: collab.size.chipH,
  paddingInlineStart: collab.space.md,
  paddingInlineEnd: collab.space.xs,
  borderRadius: collab.radius.pill,
  background: collab.color.chipBg,
  border: `${vars.borderWidth.thin} solid ${collab.color.chipBorder}`,
  color: collab.color.chipFg,
  fontFamily: vars.font.family.heading,
  fontWeight: collab.weight.semibold,
  fontSize: collab.text.appliedChip,
  whiteSpace: 'nowrap',
})
export const appliedChipRemove = style({
  display: 'grid',
  placeItems: 'center',
  inlineSize: collab.size.chipRemove,
  blockSize: collab.size.chipRemove,
  border: 'none',
  background: 'transparent',
  color: collab.color.chipFg,
  borderRadius: '50%',
  opacity: 0.7,
  cursor: 'pointer',
  transition: `opacity ${collab.ease}, background ${collab.ease}`,
  selectors: {
    '&:hover': { opacity: 1, background: collab.color.chipRemoveHover },
  },
})

export const chipsRow = style({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: collab.space.sm,
})
export const clearAllButton = style({
  border: 'none',
  background: 'transparent',
  color: collab.color.ink700,
  fontFamily: vars.font.family.heading,
  fontWeight: collab.weight.bold,
  fontSize: collab.text.body,
  cursor: 'pointer',
  selectors: { '&:hover': { color: collab.color.primary } },
})

// ── Painel avançado ──
export const panel = style({
  background: collab.color.panelBg,
  border: `${vars.borderWidth.thin} solid ${collab.color.panelBorder}`,
  borderRadius: collab.radius.lg,
  paddingBlock: collab.space.xl,
  paddingInline: collab.space.panelInl,
  display: 'flex',
  flexDirection: 'column',
  gap: collab.space.md,
})

export const advancedHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: collab.space.md,
  marginBlockEnd: collab.space.sm,
})

export const funnelBadge = style({
  display: 'grid',
  placeItems: 'center',
  inlineSize: collab.size.iconBox,
  blockSize: collab.size.iconBox,
  flexShrink: 0,
  borderRadius: collab.radius.icon,
  background: collab.color.surface,
  border: `${vars.borderWidth.thin} solid ${collab.color.panelBorder}`,
  color: collab.color.primary,
})

export const headerTexts = style({
  display: 'flex',
  flexDirection: 'column',
  gap: collab.space.xxs,
  minInlineSize: 0,
  marginInlineEnd: 'auto',
})
export const advancedTitle = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: collab.text.panelTitle,
  fontWeight: collab.weight.bold,
  color: collab.color.ink900,
})
export const advancedSubtitle = style({
  margin: 0,
  fontSize: collab.text.panelSub,
  color: collab.color.ink500,
})
export const collapseButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: collab.space.xs,
  border: 'none',
  background: 'transparent',
  color: collab.color.primary,
  fontFamily: vars.font.family.heading,
  fontWeight: collab.weight.semibold,
  fontSize: collab.text.body,
  cursor: 'pointer',
  flexShrink: 0,
})

export const groupHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: collab.space.sm,
  fontFamily: vars.font.family.heading,
  fontSize: collab.text.group,
  fontWeight: collab.weight.bold,
  color: collab.color.groupFg,
})

export const groupGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  columnGap: collab.space.gridCol,
  rowGap: collab.space.gridRow,
  alignItems: 'end',
  '@media': {
    '(min-width: 64rem)': { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' },
  },
})

export const fieldLabel = style({
  fontFamily: vars.font.family.heading,
  fontSize: collab.text.label,
  fontWeight: collab.weight.semibold,
  color: collab.color.ink700,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

export const select = style({
  blockSize: collab.size.ctrlH,
  paddingInline: collab.space.md,
  borderRadius: collab.radius.sm,
  border: `${vars.borderWidth.thin} solid ${collab.color.line}`,
  background: collab.color.surface,
  color: collab.color.ink700,
  fontFamily: vars.font.family.heading,
  fontSize: collab.text.body,
  inlineSize: '100%',
  cursor: 'pointer',
  selectors: {
    '&:focus': { outline: 'none', borderColor: collab.color.primary, boxShadow: collab.shadow.focus },
    '&:focus-visible': {
      outline: 'none',
      borderColor: collab.color.primary,
      boxShadow: collab.shadow.focus,
    },
  },
})

// Inputs do painel (átomo Input) — a borda vive no próprio <input>; sobrescrevo por descendente.
globalStyle(`${panel} input`, {
  blockSize: collab.size.ctrlH,
  borderRadius: collab.radius.sm,
  border: `${vars.borderWidth.thin} solid ${collab.color.line}`,
  background: collab.color.surface,
  color: collab.color.ink900,
  fontFamily: vars.font.family.heading,
  fontSize: collab.text.body,
})
globalStyle(`${panel} input:focus, ${panel} input:focus-visible`, {
  outline: 'none',
  borderColor: collab.color.primary,
  boxShadow: collab.shadow.focus,
})
globalStyle(`${panel} input::placeholder`, { color: collab.color.ink400 })

export const panelFooter = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: collab.space.sm,
  marginBlockStart: collab.space.xs,
})
export const footerRight = style({
  display: 'flex',
  alignItems: 'center',
  gap: collab.space.sm,
})

const footerButtonBase = style({
  blockSize: collab.size.ctrlH,
  paddingInline: vars.space.md,
  borderRadius: collab.radius.sm,
  fontFamily: vars.font.family.heading,
  fontSize: collab.text.body,
  fontWeight: collab.weight.semibold,
  cursor: 'pointer',
})
export const applyButton = style([
  footerButtonBase,
  {
    border: 'none',
    background: collab.color.primary,
    color: collab.color.surface,
    selectors: { '&:hover': { background: collab.color.primaryHover } },
  },
])
export const clearButton = style([
  footerButtonBase,
  {
    border: `${vars.borderWidth.thin} solid ${collab.color.line}`,
    background: collab.color.surface,
    color: collab.color.ink700,
    selectors: { '&:hover': { background: collab.color.surfaceAlt, borderColor: collab.color.ink400 } },
  },
])

/* Gatilho "Exportar" (btn-ghost 44px) — alinha o tamanho ao Aplicar/Limpar (o dropdown é compartilhado). */
export const exportTrigger = style([
  footerButtonBase,
  {
    display: 'inline-flex',
    alignItems: 'center',
    border: `${vars.borderWidth.thin} solid ${collab.color.line}`,
    background: collab.color.surface,
    color: collab.color.ink700,
    selectors: { '&:hover': { background: collab.color.surfaceAlt, borderColor: collab.color.ink400 } },
  },
])
