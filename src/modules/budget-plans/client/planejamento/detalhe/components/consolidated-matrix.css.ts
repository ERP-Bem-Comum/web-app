/**
 * Estilos da matriz consolidada (Detalhe/Orçamento do plano E Consolidado ABC — componente COMPARTILHADO) no
 * padrão visual "brand" (mock `consolidado-brand`). Só tokens (§X). Espelha o grid de Planejamento aprovado:
 * card surface + borda line + sombra + radius lg; primeira coluna STICKY ao rolar na horizontal; cabeçalho
 * uppercase 11.5px ink500 sobre surfaceAlt; linhas com hover; célula de nome com chevron + chip 32px
 * cadBg/primary + nome 14px 600 ink900 + subtítulo 12px ink500; sub-linhas com fundo levemente diferente +
 * conector de árvore (linha vertical + nó + ramo); rodapé "Total" surfaceAlt com valores 700 e grand primary.
 * Números tabulares. Cores/px fora do kit vivem em `consolidado.values.ts`; o resto vem de `brand`/`vars`.
 *
 * ⚠️ Este arquivo é IMPORTADO por `orcamento-grid.component.tsx` (matriz EDITÁVEL). Só o VISUAL muda aqui —
 * os nomes exportados abaixo (container/table/th/thMonth/row/childRow/nameCell/connector/connectorDot/
 * chevronButton/nameText/rowName/rowNameChild/ccSubtotal/monthCell/totalRow/totalLabelCell/totalMonthCell)
 * são contrato do Orçamento e NÃO podem ser renomeados/removidos.
 */
import { style, styleVariants, globalStyle } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

import { consolidado } from '../../consolidado/consolidado.values.ts'

const sz = consolidado.size

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: brand.space.lg,
  fontFamily: vars.font.family.heading, // Inter
})

// ── Section head: chip de ícone (34px) + h2 + controle segmentado + nav ──
export const sectionHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.md,
  flexWrap: 'wrap',
})

export const sectionTitleGroup = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: brand.space.md,
})

// Chip do ícone da seção — 34px, cadBg/primary, radius iconSm.
export const sectionTitleIcon = style({
  flexShrink: 0,
  display: 'grid',
  placeItems: 'center',
  inlineSize: sz.sectionDoc,
  blockSize: sz.sectionDoc,
  borderRadius: brand.radius.iconSm,
  background: brand.color.cadBg,
  color: brand.color.primary,
})

// "Consolidado dos programas" — 16px 700 ink900.
export const sectionTitle = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: sz.sectionTitleFont,
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
})

export const controls = style({
  marginInlineStart: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.sm,
})

// Controle segmentado (`.seg` do mock): trilho surfaceAlt + border line, botão ativo surface/primary + sombra.
export const toggleGroup = style({
  display: 'inline-flex',
  gap: 0,
  padding: sz.segPad,
  borderRadius: brand.radius.sm,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: brand.color.surfaceAlt,
})

export const toggle = style({
  border: 'none',
  background: 'transparent',
  paddingBlock: sz.segBtnPadBlock,
  paddingInline: sz.segBtnPadInline,
  borderRadius: brand.radius.xs,
  fontFamily: vars.font.family.heading,
  fontSize: sz.segBtnFont,
  fontWeight: brand.weight.semibold,
  color: brand.color.ink500,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: `all ${brand.ease}`,
  selectors: {
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: `calc(-1 * ${vars.focusRing.width})`,
    },
  },
})

// Segmento ativo — surface + primary + sombra sutil.
export const toggleActive = style({
  background: brand.color.surface,
  color: brand.color.primary,
  boxShadow: brand.shadow.btn,
})

// Nav prev/next — botões 34px border line.
export const navButton = style({
  display: 'grid',
  placeItems: 'center',
  inlineSize: sz.navBtn,
  blockSize: sz.navBtn,
  borderRadius: brand.radius.sm,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: brand.color.surface,
  color: brand.color.ink500,
  fontSize: brand.text.body,
  lineHeight: 1,
  cursor: 'pointer',
  transition: `all ${brand.ease}`,
  selectors: {
    '&:hover': { borderColor: brand.color.lineStrong, color: brand.color.ink700 },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const navDisabled = style({
  opacity: 0.4,
  cursor: 'not-allowed',
  selectors: { '&:hover': { borderColor: brand.color.line, color: brand.color.ink500 } },
})

// "Próximo" reusa a seta esquerda espelhada (não há ChevronRightIcon no kit).
export const navIconFlip = style({ display: 'inline-flex', transform: 'rotate(180deg)' })

// "Editar" (filtro por Rede aplicado no Detalhe) — primary preenchido, altura do nav.
export const editButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  blockSize: sz.navBtn,
  paddingInline: brand.space.lg,
  borderRadius: brand.radius.sm,
  border: 'none',
  background: brand.color.primary,
  color: brand.color.surface,
  boxShadow: brand.shadow.btn,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.body,
  fontWeight: brand.weight.semibold,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  selectors: {
    '&:hover': { background: brand.color.primaryHover },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

// ── Card + tabela ──
export const container = style({
  inlineSize: '100%',
  overflowX: 'auto',
  background: brand.color.surface,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  borderRadius: brand.radius.lg,
  boxShadow: brand.shadow.card,
  scrollbarWidth: 'thin',
  scrollbarColor: `${brand.color.scrollThumb} transparent`,
})

export const table = style({
  inlineSize: '100%',
  minInlineSize: sz.gridMinW,
  borderCollapse: 'collapse',
  fontFamily: vars.font.family.heading, // Inter
  fontSize: brand.text.body,
  color: brand.color.ink700,
})

// Primeira coluna STICKY (nome dos centros de custo) ao rolar na horizontal — vale p/ head/linhas/rodapé.
// `selectors` do vanilla-extract não aceita descendente (`& th:first-child`); via `globalStyle`.
globalStyle(`${table} th:first-child, ${table} td:first-child`, {
  position: 'sticky',
  insetInlineStart: 0,
  zIndex: 1,
  background: 'inherit',
  borderInlineEnd: `${vars.borderWidth.thin} solid ${brand.color.line2}`,
})

// thead: surfaceAlt, uppercase 11.5px 600 ink500, border-bottom line.
export const th = style({
  textAlign: 'end',
  paddingBlock: sz.theadPadBlock,
  paddingInline: sz.rowPadInline,
  fontFamily: vars.font.family.heading,
  fontSize: sz.theadFont,
  fontWeight: brand.weight.semibold,
  letterSpacing: '.03em',
  textTransform: 'uppercase',
  color: brand.color.ink500,
  background: brand.color.surfaceAlt,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  whiteSpace: 'nowrap',
  selectors: {
    // A 1ª coluna do head fica alinhada à esquerda e mantém o fundo surfaceAlt mesmo sticky.
    '&:first-child': { textAlign: 'start', background: brand.color.surfaceAlt },
  },
})

// Colunas de mês do cabeçalho (à direita, como o mock).
export const thMonth = style([th])

// Linha-pai (branca). Fundo próprio (não 'inherit' vazio) p/ a 1ª coluna sticky herdar branco.
export const row = style({
  background: brand.color.surface,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line2}`,
  transition: `background ${brand.ease}`,
  selectors: {
    '&:hover': { background: consolidado.rowHover },
  },
})

// Sub-linha (categoria/subcategoria) — fundo levemente diferente (#fafbfd).
export const childRow = style([
  row,
  {
    background: consolidado.childBg,
    selectors: {
      '&:hover': { background: consolidado.rowHover },
    },
  },
])

// Célula do nome: chevron + chip + nome/subtítulo. Padding aplicado direto (a `td` não tem classe própria).
export const nameCell = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.md,
  paddingBlock: sz.rowPadBlock,
  paddingInline: sz.rowPadInline,
  minInlineSize: sz.firstColMin,
  position: 'relative',
})

// Recuo da sub-linha (abre espaço p/ o conector de árvore).
export const indent = style({
  display: 'inline-block',
  inlineSize: brand.space.xl,
  flexShrink: 0,
})

// ── Conector de árvore (linha vertical + nó + ramo horizontal) — igual ao Planejamento ──
export const connector = style({
  position: 'absolute',
  insetInlineStart: sz.treeInsetX,
  insetBlockStart: sz.treeInsetY,
  insetBlockEnd: sz.treeInsetY,
  inlineSize: sz.treeWidth,
  flexShrink: 0,
  selectors: {
    '&::before': {
      content: '""',
      position: 'absolute',
      insetInlineStart: sz.treeLineOffset,
      insetBlockStart: 0,
      insetBlockEnd: 0,
      inlineSize: sz.treeLineWidth,
      background: consolidado.treeLine,
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      insetInlineStart: sz.treeLineOffset,
      insetBlockStart: '50%',
      inlineSize: sz.treeBranch,
      blockSize: sz.treeLineWidth,
      background: consolidado.treeLine,
    },
  },
})

// Primeiro filho: a linha vertical começa no TOPO da própria linha (não sobe para o pai).
export const connectorFirst = style({
  selectors: {
    '&::before': { insetBlockStart: sz.treeInsetYPos },
  },
})

// Último filho: a linha vertical para no NÓ (não desce para a linha seguinte) — como no mock.
export const connectorLast = style({
  selectors: {
    '&::before': { insetBlockEnd: '50%' },
  },
})

// Nó do conector (círculo com borda primary).
export const connectorDot = style({
  position: 'absolute',
  insetInlineStart: sz.treeDotInset,
  insetBlockStart: '50%',
  transform: 'translateY(-50%)',
  inlineSize: sz.treeDot,
  blockSize: sz.treeDot,
  borderRadius: '50%',
  background: brand.color.surface,
  border: `${sz.treeDotBorder} ${brand.color.primary}`,
  zIndex: 1,
})

// Chevron (22px, transparente, ink400, hover bg iconHover) — gira via ícone Up/Down do componente.
export const chevronButton = style({
  display: 'grid',
  placeItems: 'center',
  inlineSize: sz.chevron,
  blockSize: sz.chevron,
  flexShrink: 0,
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: brand.color.ink400,
  cursor: 'pointer',
  borderRadius: sz.chevronRadius,
  transition: `all ${brand.ease}`,
  selectors: {
    '&:hover': { background: consolidado.iconHover, color: brand.color.ink700 },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

// Chip de ícone antes do nome (32px cadBg/primary, radius iconSm).
export const rowIcon = style({
  flexShrink: 0,
  display: 'grid',
  placeItems: 'center',
  inlineSize: sz.ccChip,
  blockSize: sz.ccChip,
  borderRadius: sz.ccChipRadius,
  background: brand.color.cadBg,
  color: brand.color.primary,
})

// Chip menor nas linhas-filhas (mock: `.cc-chip.sm` = 28px).
export const rowIconChild = style([rowIcon, { inlineSize: sz.ccChipSm, blockSize: sz.ccChipSm }])

export const nameText = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: sz.nameGap,
  minInlineSize: 0,
  textAlign: 'start',
})

// Linha do nome: nome + badge da natureza inline (à esquerda), como no mock.
export const nameLine = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  minInlineSize: 0,
  maxInlineSize: '100%',
})

// Nome da linha-pai — 14px 600 ink900.
export const rowName = style({
  fontFamily: vars.font.family.heading,
  fontSize: sz.nameFont,
  fontWeight: brand.weight.semibold,
  color: brand.color.ink900,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

// Nome da linha-filha — mesma família; fica com o tom ink900 do mock.
export const rowNameChild = style([rowName])

// Subtítulo (subtotal do nó) — 12px ink500, tabular.
export const ccSubtotal = style({
  fontFamily: vars.font.family.heading,
  fontSize: sz.subFont,
  color: brand.color.ink500,
  fontVariantNumeric: 'tabular-nums',
  textAlign: 'start',
})

// Tag da natureza do centro de custo, ao lado do nome (mock). "A pagar" = âmbar; "A receber" = verde.
const payTagBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  flexShrink: 0,
  marginInlineStart: brand.space.sm,
  paddingBlock: sz.payPadBlock,
  paddingInline: sz.payPadInline,
  borderRadius: brand.radius.xs,
  fontSize: sz.payFont,
  fontWeight: brand.weight.bold,
  letterSpacing: '.04em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
})

export const payTag = style([payTagBase, { background: consolidado.payBg, color: consolidado.payFg }])

// "A receber" — verde (tom "ok" da marca), para distinguir da natureza "a pagar".
export const payTagReceive = style([payTagBase, { background: brand.color.okBg, color: brand.color.okFg }])

// Célula de mês — número tabular ink700, alinhado à direita (mock).
export const monthCell = style({
  paddingBlock: sz.rowPadBlock,
  paddingInline: sz.rowPadInline,
  textAlign: 'end',
  whiteSpace: 'nowrap',
  color: brand.color.ink700,
  fontVariantNumeric: 'tabular-nums',
})

// Variantes de ênfase p/ os números (zero apagado / strong) — usadas quando a view classificar a célula.
export const monthCellTone = styleVariants({
  zero: { color: brand.color.ink400 },
  strong: { fontWeight: brand.weight.semibold, color: brand.color.ink900 },
})

// ── Rodapé "Total" — surfaceAlt, border-top line, valores 700, grand primary ──
export const totalRow = style({
  background: brand.color.surfaceAlt,
  borderBlockStart: `${vars.borderWidth.thin} solid ${brand.color.line}`,
})

export const totalLabelCell = style({
  paddingBlock: sz.footerPadBlock,
  paddingInline: sz.rowPadInline,
  fontFamily: vars.font.family.heading,
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
  whiteSpace: 'nowrap',
  selectors: { '&:first-child': { background: brand.color.surfaceAlt } },
})

export const totalLabelGroup = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: brand.space.md,
})

// Chip da balança no rodapé — igual ao chip das linhas (levemente mais frio).
export const totalLabelIcon = style({
  flexShrink: 0,
  display: 'grid',
  placeItems: 'center',
  inlineSize: sz.ccChip,
  blockSize: sz.ccChip,
  borderRadius: sz.ccChipRadius,
  background: consolidado.footerChipBg,
  color: brand.color.primary,
})

// Totais por mês no rodapé — 700 ink900, tabular; o ÚLTIMO (grand) fica em primary via `totalMonthGrand`.
export const totalMonthCell = style([
  monthCell,
  {
    fontWeight: brand.weight.bold,
    color: brand.color.ink900,
  },
])

export const totalMonthGrand = style([totalMonthCell, { color: brand.color.primary }])
