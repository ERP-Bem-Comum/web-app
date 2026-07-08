/**
 * Estilos da tabela do "Relatório Geral" — CSS GRID (não <table>) de 15 colunas (ledger achatado), com SCROLL
 * HORIZONTAL (`overflow-x: auto`) por serem muitas colunas. Identidade "brand", só-tokens (§X). thead sticky no
 * topo do scroll vertical. px/hex crus NÃO entram aqui.
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

// Largura mínima POR coluna (id → rem). O seletor de colunas monta o `grid-template-columns` só com as
// colunas VISÍVEIS (na ordem do legado), então a largura precisa ser endereçável por id — não posicional.
// As dimensões cruas ficam AQUI (camada *.css.ts), fora do componente (§X). O grid transborda → `.scroller`
// rola na horizontal.
export const COLUMN_WIDTH: Record<string, string> = {
  data: '6.5rem',
  vencimento: '7rem',
  tipo: '7rem',
  numeroContrato: '8rem',
  codigo: '7rem',
  parcela: '5rem',
  apontamento: '14rem',
  fornecedor: '15rem',
  financiador: '13rem',
  colaborador: '11rem',
  centroCusto: '12rem',
  categoria: '11rem',
  subcategoria: '12rem',
  pixBancario: '7rem',
  valor: '9rem',
}

export const card = style({
  background: brand.color.surface,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  borderRadius: brand.radius.lg,
  boxShadow: brand.shadow.card,
  overflow: 'hidden',
  fontFamily: vars.font.family.heading,
  color: brand.color.ink700,
  fontSize: brand.text.body,
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
export const cardCount = style({
  marginInlineStart: 'auto',
  fontSize: brand.text.hint,
  color: brand.color.ink400,
  fontVariantNumeric: 'tabular-nums',
})

// Contêiner com scroll HORIZONTAL (muitas colunas) + vertical (thead sticky).
export const scroller = style({
  overflowX: 'auto',
  overflowY: 'auto',
  maxBlockSize: '34rem',
  scrollbarWidth: 'thin',
  scrollbarColor: `${brand.color.scrollThumb} transparent`,
  selectors: {
    '&::-webkit-scrollbar': { blockSize: '0.5rem', inlineSize: '0.5rem' },
    '&::-webkit-scrollbar-thumb': { background: brand.color.scrollThumb, borderRadius: brand.radius.sm },
    '&::-webkit-scrollbar-track': { background: 'transparent' },
  },
})

// `gridTemplateColumns` é setado INLINE pela View (composto só com as colunas visíveis, na ordem) — por isso
// não vive aqui. O resto do layout do grid é estático.
const gridRow = style({
  display: 'grid',
  alignItems: 'center',
  gap: brand.space.md,
  // Soma das colunas — força a largura mínima do grid (o `.scroller` rola quando estreito).
  minInlineSize: 'max-content',
})

export const thead = style([
  gridRow,
  {
    position: 'sticky',
    insetBlockStart: 0,
    zIndex: 1,
    background: brand.color.surfaceAlt,
    borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line}`,
    paddingBlock: brand.size.theadPadBlock,
    paddingInline: brand.size.rowPadInline,
    fontSize: brand.text.thead,
    fontWeight: brand.weight.semibold,
    letterSpacing: '.03em',
    textTransform: 'uppercase',
    color: brand.color.ink500,
    whiteSpace: 'nowrap',
  },
])

export const row = style([
  gridRow,
  {
    paddingBlock: brand.size.rowPadBlock,
    paddingInline: brand.size.rowPadInline,
    borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line2}`,
    selectors: {
      '&:last-child': { borderBlockEnd: 'none' },
      '&:hover': { background: brand.color.rowHover },
    },
  },
])

export const cell = style({
  color: brand.color.ink700,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})
// Célula de destaque (Tipo/Código) — tinta forte.
export const cellStrong = style([cell, { fontWeight: brand.weight.semibold, color: brand.color.ink900 }])
// Valor — alinhado à direita, tabular, forte.
export const cellValue = style({
  textAlign: 'end',
  fontVariantNumeric: 'tabular-nums',
  fontWeight: brand.weight.semibold,
  color: brand.color.ink900,
  whiteSpace: 'nowrap',
})
export const theadValue = style({ textAlign: 'end' })
// Campo ausente ("—") — tinta suave.
export const cellMuted = style([cell, { color: brand.color.ink400 }])

export const empty = style({
  paddingBlock: brand.space.xxl,
  textAlign: 'center',
  color: brand.color.ink500,
  fontSize: brand.text.body,
})
