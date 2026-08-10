/**
 * Estilos da page "Equipe ABC" — identidade "brand", só-tokens (§X). Cobre: cabeçalho (voltar + título +
 * Filtros/Exportar), filtros recolhíveis (grade de campos placeholder + Filtrar), a grade dos cartões de
 * gráfico (2-up onde cabe, "por Função" full-width) e o espaçamento até a tabela. Nenhum hex/px cru aqui —
 * tudo vem de `brand`/`vars`. Reaproveita o padrão do relatório Realizado × Planejado.
 */
import { style } from '@vanilla-extract/css'

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

// Botão ghost (Filtros). Estado ativo (aria-pressed) quando os filtros estão abertos.
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

// Botão "Exportar" (CSV único) — mesmo visual do ghost, com download icon.
export const exportButton = style([ghostBase])

// ── Filtros recolhíveis (max-height/opacity animados) ──
export const filters = {
  closed: style({
    overflow: 'hidden',
    maxBlockSize: 0,
    opacity: 0,
    marginBlockEnd: 0,
    transition: 'max-height .25s ease, opacity .2s, margin .2s',
  }),
  open: style({
    overflow: 'hidden',
    maxBlockSize: '30rem',
    opacity: 1,
    marginBlockEnd: brand.space.gridRow,
    transition: 'max-height .25s ease, opacity .2s, margin .2s',
  }),
}

export const filtersInner = style({
  background: brand.color.surface,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  borderRadius: brand.radius.lg,
  boxShadow: brand.shadow.card,
  padding: `${brand.space.gridRow} ${brand.space.gridCol}`,
})

// Campo de busca "Pesquise" (linha própria, largura total).
export const searchRow = style({ marginBlockEnd: brand.space.gridRow })
export const searchInput = style({
  inlineSize: '100%',
  blockSize: brand.size.field,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  borderRadius: brand.radius.sm,
  background: brand.color.surface,
  paddingInline: brand.space.md,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.body,
  color: brand.color.ink700,
  transition: `all ${brand.ease}`,
  selectors: {
    '&::placeholder': { color: brand.color.ink400 },
    '&:focus': { outline: 'none', borderColor: brand.color.primary, boxShadow: brand.shadow.focus },
  },
})

// Grade dos campos de filtro (auto-fit, responsiva).
export const fieldsGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(11rem, 1fr))',
  gap: brand.space.gridRow,
  alignItems: 'flex-end',
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
  inlineSize: '100%',
  blockSize: brand.size.field,
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
    '&:focus': { outline: 'none', borderColor: brand.color.primary, boxShadow: brand.shadow.focus },
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

export const filtersActions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  marginBlockStart: brand.space.gridRow,
})
export const applyButton = style({
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

// ── Cartões de gráfico ──
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
export const chartCard = style([card, { display: 'flex', flexDirection: 'column' }])
export const chartPad = style({
  padding: `${brand.space.gridRow} ${brand.space.gridCol} ${brand.space.gridCol}`,
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  // `flex-start`, NÃO `center`: a grade dos 3 cards é `stretch`, então todos ficam com a altura do MAIOR.
  // Centralizar empurrava o conteúdo dos cards menores para o meio e abria um vazio enorme em cima e
  // embaixo — foi o que a P.O. viu. Alinhado ao topo, o gráfico começa logo abaixo do título e o espaço
  // que sobra fica no fim do card, onde não incomoda.
  justifyContent: 'flex-start',
})

// Grade 2-up (linha de baixo: Ano + Função) — colapsa em 1 coluna no responsivo.
export const charts2 = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: brand.space.gridRow,
  marginBlockEnd: brand.space.gridRow,
  alignItems: 'stretch',
  '@media': { 'screen and (max-width: 60rem)': { gridTemplateColumns: '1fr' } },
})

// Grade 3-up (linha de cima: Gênero + Idade + Raça/Cor) — colapsa em 1 coluna no responsivo,
// espelhando o breakpoint de `charts2`.
export const charts3 = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: brand.space.gridRow,
  marginBlockEnd: brand.space.gridRow,
  alignItems: 'stretch',
  '@media': { 'screen and (max-width: 60rem)': { gridTemplateColumns: '1fr' } },
})

// "por Função" full-width.
export const chartFull = style({ marginBlockEnd: brand.space.gridRow })

// ── Modal de detalhe do colaborador (só os 9 campos enxutos — LGPD) ──
export const modalOverlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 200,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: vars.space.lg,
  background: vars.color.institutional.overlay,
})

export const modalDialog = style({
  inlineSize: '30rem',
  maxInlineSize: '100%',
  maxBlockSize: '90vh',
  overflowY: 'auto',
  background: brand.color.surface,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  borderRadius: brand.radius.lg,
  boxShadow: brand.shadow.card,
})

export const modalHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.md,
  paddingBlock: brand.space.gridRow,
  paddingInline: brand.space.gridCol,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line2}`,
})
export const modalTitle = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.sectionH2,
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
})

// Lista rótulo/valor (definition list) dos 9 campos.
export const modalList = style({
  margin: 0,
  paddingBlock: brand.space.gridRow,
  paddingInline: brand.space.gridCol,
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: brand.space.md,
})
export const modalRow = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(9rem, 12rem) 1fr',
  gap: brand.space.md,
  alignItems: 'baseline',
})
export const modalDt = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.thead,
  fontWeight: brand.weight.semibold,
  letterSpacing: '.03em',
  textTransform: 'uppercase',
  color: brand.color.ink500,
})
export const modalDd = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.body,
  color: brand.color.ink900,
})

export const modalActions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: brand.space.sm,
  paddingBlock: brand.space.gridRow,
  paddingInline: brand.space.gridCol,
  borderBlockStart: `${vars.borderWidth.thin} solid ${brand.color.line2}`,
})
export const modalCancelBtn = style([ghostBase])
export const modalPrimaryBtn = style([
  {
    blockSize: brand.size.ctrlH,
    paddingInline: brand.space.gridCol,
    display: 'inline-flex',
    alignItems: 'center',
    gap: brand.space.sm,
    border: 'none',
    borderRadius: brand.radius.sm,
    background: brand.color.primary,
    color: brand.color.surface,
    fontFamily: vars.font.family.heading,
    fontSize: brand.text.body,
    fontWeight: brand.weight.semibold,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: `all ${brand.ease}`,
    selectors: {
      '&:hover': { background: brand.color.primaryHover },
      '&:focus-visible': {
        outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
        outlineOffset: vars.focusRing.offset,
      },
    },
  },
])
