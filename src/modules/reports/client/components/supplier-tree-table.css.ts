/**
 * Tree-table do relatório "Fornecedores sem Contrato" — identidade "brand" (só-tokens §X). Espelha o cartão
 * dos grids brand (surface + line + radius lg + sombra) e o pattern da matriz consolidada: linha-pai com
 * chevron, linhas-filhas (planos) recuadas com fundo levemente diferente, thead uppercase 11.5px ink500.
 * A linha do fornecedor que ESTOUROU o limite usa o tom DANGER da marca (sinal de compliance — mantido).
 * px/hex crus não entram aqui: tudo vem de `brand`/`vars`.
 */
import { style, styleVariants } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

// 4 colunas: FORNECEDOR (flex) | VALOR TOTAL | TOTAL UTILIZADO (%) | TOTAL RESTANTE.
const GRID_COLUMNS = 'minmax(16rem, 2.4fr) minmax(8rem, 1fr) minmax(9rem, 1fr) minmax(9rem, 1fr)'

export const card = style({
  background: brand.color.surface,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  borderRadius: brand.radius.lg,
  boxShadow: brand.shadow.card,
  overflow: 'hidden',
  fontFamily: vars.font.family.heading, // Inter
  color: brand.color.ink700,
  fontSize: brand.text.body,
})

const gridRow = style({ display: 'grid', gridTemplateColumns: GRID_COLUMNS, alignItems: 'center' })

export const thead = style([
  gridRow,
  {
    background: brand.color.surfaceAlt,
    borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line}`,
    paddingBlock: brand.size.theadPadBlock,
    paddingInline: brand.size.rowPadInline,
    fontSize: brand.text.thead,
    fontWeight: brand.weight.semibold,
    letterSpacing: '.03em',
    textTransform: 'uppercase',
    color: brand.color.ink500,
  },
])

// Colunas numéricas alinhadas à direita (VALOR TOTAL / % / RESTANTE).
export const theadNum = style({ textAlign: 'end' })

// Linha-pai (fornecedor).
export const supplierRow = style([
  gridRow,
  {
    paddingBlock: brand.size.rowPadBlock,
    paddingInline: brand.size.rowPadInline,
    borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line2}`,
    transition: `background ${brand.ease}`,
    selectors: { '&:hover': { background: brand.color.rowHover } },
  },
])

// Fornecedor que ESTOUROU o limite — tom danger (fundo + texto vermelho da marca).
export const supplierRowDanger = style([
  supplierRow,
  {
    background: brand.color.dangerBg,
    color: brand.color.dangerFg,
    selectors: { '&:hover': { background: brand.color.dangerBg } },
  },
])

// Fornecedor NO LIMITE (restante = 0 / 100% exato) — tom neutro suave (não é violação; teto esgotado).
export const supplierRowAtLimit = style([
  supplierRow,
  {
    background: brand.color.atLimitBg,
    color: brand.color.atLimitFg,
    selectors: { '&:hover': { background: brand.color.atLimitBg } },
  },
])

// Linha-filha (plano orçamentário) — recuada + fundo levemente diferente.
export const planRow = style([
  gridRow,
  {
    background: brand.color.surfaceAlt,
    paddingBlock: brand.size.chipPadBlock,
    paddingInline: brand.size.rowPadInline,
    borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line2}`,
    color: brand.color.ink500,
    fontSize: brand.text.dd,
  },
])

// Célula do nome do fornecedor: chevron + texto.
export const nameCell = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.sm,
  minInlineSize: 0,
})

export const supplierName = style({
  fontWeight: brand.weight.semibold,
  color: 'inherit',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

// Recuo da linha-filha (uma coluna de chevron por nível de profundidade).
export const indent = style({ display: 'inline-block', inlineSize: brand.space.xl, flexShrink: 0 })

// Nome do plano (linha-filha) — herda o ink500 do planRow.
export const planName = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

// Chevron de expandir/recolher (transparente, ink400, hover suave).
export const chevronButton = style({
  display: 'grid',
  placeItems: 'center',
  inlineSize: brand.space.xl,
  blockSize: brand.space.xl,
  flexShrink: 0,
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: 'inherit',
  cursor: 'pointer',
  borderRadius: brand.radius.xs,
  transition: `all ${brand.ease}`,
  selectors: {
    '&:hover': { background: brand.color.line2 },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

// Células numéricas — tabular, à direita.
export const numCell = style({
  textAlign: 'end',
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
})

// Tom do % utilizado (danger quando estoura; senão herda). O RESTANTE negativo também fica danger.
export const numTone = styleVariants({
  danger: { color: brand.color.dangerFg, fontWeight: brand.weight.semibold },
  strong: { color: brand.color.ink900, fontWeight: brand.weight.semibold },
})

// Estado vazio (largura toda).
export const stateRow = style({
  paddingBlock: brand.space.xxl,
  paddingInline: brand.size.rowPadInline,
  textAlign: 'center',
  color: brand.color.ink500,
})
