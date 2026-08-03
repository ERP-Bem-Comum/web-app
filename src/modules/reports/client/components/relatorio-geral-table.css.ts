/**
 * Estilos da tabela do "Relatório Geral" — CSS GRID (não <table>) de 15 colunas (ledger achatado), com SCROLL
 * HORIZONTAL (`overflow-x: auto`) por serem muitas colunas. Identidade "brand", só-tokens (§X). thead sticky no
 * topo do scroll vertical. px/hex crus NÃO entram aqui.
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

// Largura POR coluna (id → track). O seletor de colunas monta o `grid-template-columns` só com as colunas
// VISÍVEIS (na ordem do legado), então a largura precisa ser endereçável por id — não posicional. As
// dimensões cruas ficam AQUI (camada *.css.ts), fora do componente (§X). O grid transborda → `.scroller`
// rola na horizontal.
//
// `minmax(<mín>, max-content)`: a coluna usa o MÍNIMO quando o conteúdo é curto e CRESCE até caber quando é
// longo — nunca corta (o `overflow/ellipsis` da célula vira salvaguarda, não recorte). Sem espaço interno na
// função (o componente faz `.join(' ')` das tracks).
const fit = (min: string): string => `minmax(${min},max-content)`

export const COLUMN_WIDTH: Record<string, string> = {
  data: fit('6.5rem'),
  vencimento: fit('7rem'),
  tipo: fit('9rem'),
  numeroContrato: fit('8rem'),
  codigo: fit('7rem'),
  parcela: fit('5rem'),
  apontamento: fit('14rem'),
  fornecedor: fit('15rem'),
  financiador: fit('13rem'),
  colaborador: fit('11rem'),
  centroCusto: fit('12rem'),
  categoria: fit('11rem'),
  subcategoria: fit('12rem'),
  pixBancario: fit('7rem'),
  valor: fit('9rem'),
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
  // SEM gap: as células colam (padding interno) → as colunas fixas (Data/Valor) não deixam vazar no scroll.
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
    borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line2}`,
    selectors: {
      '&:last-child': { borderBlockEnd: 'none' },
      '&:hover': { background: brand.color.rowHover },
    },
  },
])

// Padding INLINE por célula (antes vinha do gap + padding da linha). Aplicado a todas as células (thead + corpo).
const cellPad = { paddingInline: brand.size.rowPadInline }

export const headCell = style(cellPad)

export const cell = style({
  ...cellPad,
  color: brand.color.ink700,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})
// Célula de destaque (Tipo/Código) — tinta forte.
export const cellStrong = style([cell, { fontWeight: brand.weight.semibold, color: brand.color.ink900 }])
// Valor — alinhado à direita, tabular, forte.
export const cellValue = style({
  ...cellPad,
  textAlign: 'end',
  fontVariantNumeric: 'tabular-nums',
  fontWeight: brand.weight.semibold,
  color: brand.color.ink900,
  whiteSpace: 'nowrap',
})
export const theadValue = style({ textAlign: 'end' })
// Campo ausente ("—") — tinta suave.
export const cellMuted = style([cell, { color: brand.color.ink400 }])

// ── Colunas FIXAS: Data (à esquerda) e Valor (à direita) grudam ao rolar na horizontal (espelho do legado). ──
export const stickyLeft = style({
  position: 'sticky',
  insetInlineStart: 0,
  zIndex: 2,
  background: brand.color.surface,
  borderInlineEnd: `${vars.borderWidth.thin} solid ${brand.color.line2}`,
  selectors: { [`${row}:hover &`]: { background: brand.color.rowHover } },
})
export const stickyRight = style({
  position: 'sticky',
  insetInlineEnd: 0,
  zIndex: 2,
  background: brand.color.surface,
  borderInlineStart: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  selectors: { [`${row}:hover &`]: { background: brand.color.rowHover } },
})
// No thead as fixas ficam sobre o fundo do cabeçalho (surfaceAlt) e acima das do corpo.
export const stickyLeftHead = style([stickyLeft, { background: brand.color.surfaceAlt, zIndex: 3 }])
export const stickyRightHead = style([stickyRight, { background: brand.color.surfaceAlt, zIndex: 3 }])

// ── Separador de MÊS (linha-faixa que agrupa o ledger por mês de vencimento). Grid-row → cobre a largura total. ──
export const monthSep = style([
  gridRow,
  {
    background: brand.color.surfaceAlt,
    borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line2}`,
    paddingBlock: brand.space.sm,
  },
])
export const monthSepLabel = style({
  position: 'sticky',
  insetInlineStart: 0,
  paddingInline: brand.size.rowPadInline,
  fontSize: brand.text.thead,
  fontWeight: brand.weight.bold,
  letterSpacing: '.04em',
  textTransform: 'uppercase',
  color: brand.color.fluxo.previsto,
})

// ── Chip do TIPO (pílula com bolinha). O #442 é payables-only → um único tipo "A pagar" (tom de saída). ──
export const tipoChip = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: brand.space.xs,
  paddingBlock: '0.125rem',
  paddingInline: brand.space.sm,
  borderRadius: brand.radius.pill,
  fontSize: brand.text.chip,
  fontWeight: brand.weight.bold,
  background: brand.color.fluxo.saldoNegTintBg,
  color: brand.color.fluxo.saldoNeg,
})
export const tipoDot = style({
  inlineSize: '0.375rem',
  blockSize: '0.375rem',
  borderRadius: brand.radius.pill,
  background: brand.color.fluxo.saldoNeg,
})

export const empty = style({
  paddingBlock: brand.space.xxl,
  textAlign: 'center',
  color: brand.color.ink500,
  fontSize: brand.text.body,
})
