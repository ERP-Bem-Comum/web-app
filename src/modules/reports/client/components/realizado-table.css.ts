/**
 * Estilos da tabela "Detalhamento por mês" (mock) — CSS GRID (não <table>) com coluna de nome STICKY à
 * esquerda e um passador de meses (WIN=3) que substitui o scroll horizontal largo. Identidade "brand",
 * só-tokens (§X). O `grid-template-columns` é DINÂMICO (muda com o nº de meses visíveis) → a view o passa por
 * `style={{ gridTemplateColumns }}` inline (rem cru em inline-style é permitido; hex/px cru ficam fora do
 * `.css.ts`). Cada "linha" (thead1/thead2/trow/tfoot) é um grid com as mesmas colunas.
 *
 * STICKY: a 1ª coluna (Centro de custo) usa `position: sticky; inset-inline-start: 0` com fundo OPACO (surface
 * ou child-bg por nível) + borda direita + z-index acima das células roláveis, para as colunas de mês
 * passarem por baixo dela limpamente. O scroll horizontal vive no `.scroll` (overflow-x auto).
 */
import { style, styleVariants } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

// Contêiner com scroll horizontal (o passador reduz a necessidade, mas 3 meses ainda podem transbordar).
export const scroll = style({
  overflowX: 'auto',
  scrollbarWidth: 'thin',
  scrollbarColor: `${brand.color.scrollThumb} transparent`,
  selectors: {
    '&::-webkit-scrollbar': { blockSize: '0.5rem' },
    '&::-webkit-scrollbar-thumb': { background: brand.color.scrollThumb, borderRadius: brand.radius.sm },
    '&::-webkit-scrollbar-track': { background: 'transparent' },
  },
})

// Base de qualquer "linha" do grid — as colunas vêm por inline-style (gridTemplateColumns).
const gridRowBase = style({ display: 'grid', alignItems: 'center' })

// thead1: linha de grupos ("Consolidado do ano" + "Dez/26" …).
export const thead1 = style([
  gridRowBase,
  // Fundo azul claro (monthHeadBg) — distinto da sub-linha thead2 (cinza surfaceAlt) logo abaixo.
  {
    background: brand.color.rxp.monthHeadBg,
    borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line2}`,
  },
])
export const thead1Cell = style({
  paddingBlock: brand.space.sm,
  paddingInline: brand.space.lg,
  fontSize: brand.text.thead,
  fontWeight: brand.weight.bold,
  letterSpacing: '.03em',
  textTransform: 'uppercase',
  color: brand.color.primary,
  textAlign: 'center',
  // Divisória dos meses mais evidente (lineStrong) — separa os grupos de mês com clareza.
  borderInlineStart: `${vars.borderWidth.thin} solid ${brand.color.lineStrong}`,
  whiteSpace: 'nowrap',
})
export const thead1CellFirst = style([thead1Cell, { borderInlineStart: 'none' }])

// thead2: sub-colunas (Provisionado/Realizado/Planejado/AV% + por mês Provis./Realiz./Planej.).
export const thead2 = style([
  gridRowBase,
  {
    background: brand.color.surfaceAlt,
    borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  },
])
export const thead2Cell = style({
  paddingBlock: brand.space.xs,
  paddingInline: brand.space.md,
  fontSize: brand.text.thead,
  fontWeight: brand.weight.semibold,
  letterSpacing: '.02em',
  textTransform: 'uppercase',
  color: brand.color.ink500,
  textAlign: 'end',
  whiteSpace: 'nowrap',
})
export const thead2CellStart = style([thead2Cell, { textAlign: 'start' }])
// 1ª sub-coluna de cada mês no thead2 — recebe a divisória evidente (continua a linha do thead1/dados).
export const thead2CellMonthFirst = style([
  thead2Cell,
  { borderInlineStart: `${vars.borderWidth.thin} solid ${brand.color.lineStrong}` },
])

// Linha de dados (trow).
export const trow = style([
  gridRowBase,
  {
    background: brand.color.surface,
    borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line2}`,
    transition: `background ${brand.ease}`,
    selectors: { '&:hover': { background: brand.color.rowHover } },
  },
])
// Níveis (categoria / subcategoria) — fundos por nível.
export const trowLvl = styleVariants({
  0: {},
  1: {
    background: brand.color.rxp.childBg1,
    selectors: { '&:hover': { background: brand.color.rxp.childBg1Hover } },
  },
  2: {
    background: brand.color.rxp.childBg2,
    selectors: { '&:hover': { background: brand.color.rxp.childBg2Hover } },
  },
})

// Célula numérica (à direita, tabular).
export const cell = style({
  paddingBlock: brand.space.md,
  paddingInline: brand.space.md,
  textAlign: 'end',
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
  color: brand.color.ink700,
})
// Primeira sub-coluna de cada grupo de mês recebe o separador à esquerda.
export const cellMonthFirst = style([
  cell,
  // Divisória dos meses mais evidente (lineStrong), contínua com o cabeçalho.
  { borderInlineStart: `${vars.borderWidth.thin} solid ${brand.color.lineStrong}` },
])

// Coluna de nome (Centro de custo) STICKY à esquerda.
export const colFirst = style({
  position: 'sticky',
  insetInlineStart: 0,
  zIndex: 1,
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.sm,
  paddingBlock: brand.space.md,
  paddingInlineEnd: brand.space.md,
  background: brand.color.surface,
  borderInlineEnd: `${vars.borderWidth.thin} solid ${brand.color.line2}`,
  color: brand.color.ink900,
  fontWeight: brand.weight.semibold,
  textAlign: 'start',
  lineHeight: 1.3,
})
// Fundo sticky por contexto (head/rodapé = surfaceAlt; níveis 1/2 = child-bg) para casar com a linha.
export const colFirstHead = style([colFirst, { background: brand.color.surfaceAlt }])
// Célula sticky da 1ª coluna na linha de grupos de mês (thead1) — mesmo azul claro do thead1.
export const colFirstHead1 = style([colFirst, { background: brand.color.rxp.monthHeadBg }])
export const colFirstLvl = styleVariants({
  0: {},
  1: {
    background: brand.color.rxp.childBg1,
    selectors: { [`${trow}:hover &`]: { background: brand.color.rxp.childBg1Hover } },
  },
  2: {
    background: brand.color.rxp.childBg2,
    selectors: { [`${trow}:hover &`]: { background: brand.color.rxp.childBg2Hover } },
  },
})
// Hover do nível-0 (surface) precisa acompanhar o hover da linha.
export const colFirstHoverSync = style({
  selectors: { [`${trow}:hover &`]: { background: brand.color.rowHover } },
})

// Chevron (expande/recolhe) — rotaciona 90° quando aberto.
export const chev = style({
  inlineSize: '1.25rem',
  blockSize: '1.25rem',
  flexShrink: 0,
  display: 'grid',
  placeItems: 'center',
  border: 'none',
  background: 'transparent',
  color: brand.color.ink400,
  borderRadius: brand.radius.xs,
  cursor: 'pointer',
  transition: `all ${brand.ease}`,
  selectors: {
    '&:hover': { background: brand.color.line, color: brand.color.ink700 },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})
// O SVG interno rotaciona ao abrir.
export const chevIcon = style({ transition: 'transform .18s ease', display: 'inline-flex' })
export const chevIconOpen = style({ transform: 'rotate(90deg)' })
// Espaçador invisível (nós-folha de nível-0, para alinhar com quem tem chevron).
export const chevSpacer = style([chev, { visibility: 'hidden', cursor: 'default' }])

// Nó-folha (ring dot) para categorias/subcategorias sem filhos.
export const treeNode = style({
  inlineSize: brand.rxp.treeNode,
  blockSize: brand.rxp.treeNode,
  borderRadius: brand.radius.pill,
  background: brand.color.surface,
  border: `${vars.borderWidth.thick} solid ${brand.color.rxp.treeNodeBorder}`,
  flexShrink: 0,
  marginInlineStart: brand.space.xxs,
  marginInlineEnd: brand.space.xs,
})

// Nome por nível.
export const nameLvl = styleVariants({
  0: { fontWeight: brand.weight.bold, color: brand.color.ink900 },
  1: { fontWeight: brand.weight.semibold, color: brand.color.ink900 },
  2: { fontWeight: brand.weight.medium, color: brand.color.ink500 },
})

// Valores.
export const zero = style({ color: brand.color.ink400, fontWeight: '400' })
export const planVal = style({ fontWeight: brand.weight.semibold, color: brand.color.ink900 })
export const planValSub = style({ fontWeight: brand.weight.medium, color: brand.color.ink700 })

// AV% — mini barra (fill verde) + texto.
export const av = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.sm,
  justifyContent: 'flex-end',
})
export const avBar = style({
  inlineSize: brand.rxp.avBarWidth,
  blockSize: brand.rxp.avBarHeight,
  borderRadius: brand.radius.xs,
  background: brand.color.surfaceAlt,
  overflow: 'hidden',
  flexShrink: 0,
})
export const avFill = style({ display: 'block', blockSize: '100%', background: brand.color.rxp.realizado })

// Rodapé "Total".
export const tfoot = style([
  gridRowBase,
  {
    background: brand.color.surfaceAlt,
    borderBlockStart: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  },
])
export const tfootCell = style([cell, { fontWeight: brand.weight.bold, color: brand.color.ink900 }])
