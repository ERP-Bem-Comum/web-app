/**
 * Estilos da tabela hierárquica de UMA seção do "Fluxo de Caixa" — CSS GRID (não <table>) de 3 colunas
 * (Categoria/Subcategoria árvore + as 2 medidas Realizado/Previsto) com a 1ª coluna STICKY à esquerda.
 * Identidade "brand", só-tokens (§X).
 *
 * ── PELE = "Realizado × Planejado" ── REUSA a pele da tree do RxP (`realizado-table.css.ts`): fundos por
 * nível (childBg1/childBg2), nó-folha, chevron, coluna sticky e cabeçalho `thead2`. As classes compartilhadas
 * são RE-EXPORTADAS daqui (padrão sibling: mesma identidade, zero duplicação, RxP intacto). As cores das 2
 * medidas entram por `styleVariants` sobre `brand.color.fluxo.*`. px/hex crus NÃO entram aqui.
 */
import { style, styleVariants } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

// Pele compartilhada da tree do RxP (re-export — a view importa tudo daqui).
export {
  scroll,
  thead2 as thead,
  thead2Cell as theadCell,
  thead2CellStart as theadCellStart,
  trow,
  trowLvl,
  cell,
  colFirst,
  colFirstLvl,
  colFirstHoverSync,
  colFirstHead,
  chev,
  chevIcon,
  chevIconOpen,
  chevSpacer,
  treeNode,
  nameLvl,
  tfoot,
  tfootCell,
} from './realizado-table.css.ts'
// Card + cabeçalho do card (mesmo cartão dos gráficos/tabela do RxP).
export { card, cardHeader as cardHeadRow, cardTitle } from '../page/realizado-x-planejado.page.css.ts'

// 3 colunas: nome (árvore, sticky, largura fixa p/ o sticky) + 2 medidas (piso legível, fr distribui a folga).
export const gridCols = style({
  gridTemplateColumns: '22rem repeat(2, minmax(9rem, 1fr))',
})

// Cor por medida — aplicada SÓ no CABEÇALHO da coluna (identidade da coluna). O corpo fica em tinta neutra
// (mais elegante que colorir cada valor). As views não importam tokens (cor por classe §X).
export const measureTone = styleVariants({
  realizedCents: { color: brand.color.fluxo.realizado },
  expectedCents: { color: brand.color.fluxo.previsto },
})

// Valor no CORPO da tabela — tinta neutra (ink900), tabular.
export const cellValueNeutral = style({
  color: brand.color.ink900,
  fontWeight: brand.weight.medium,
  fontVariantNumeric: 'tabular-nums',
})

// Valor ZERO — atenua (cinza) para não competir com os valores presentes.
export const zeroTone = style({ color: brand.color.ink400, fontWeight: '400' })

// Empty state da SEÇÃO (categorias vazias — ex.: Entradas quando o A-Receber ainda não subiu). Painel único
// centralizado dentro do card, sem tabela quebrada. Só-tokens (§X).
export const emptyPanel = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: brand.space.sm,
  textAlign: 'center',
  paddingBlock: '3rem',
  paddingInline: brand.space.xxl,
})
export const emptyTitle = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.panelTitle,
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
})
export const emptyHint = style({
  margin: 0,
  fontSize: brand.text.body,
  color: brand.color.ink500,
  maxInlineSize: '28rem',
})
