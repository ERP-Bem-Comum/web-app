/**
 * Estilos da tabela hierárquica "Posição de Pagamentos" — CSS GRID (não <table>) de 4 colunas (Fornecedor/
 * CC/Categoria árvore + as 3 medidas derivadas Em atraso/Pago/A pagar) com a 1ª coluna STICKY à esquerda.
 * Identidade "brand", só-tokens (§X).
 *
 * ── PELE = "Realizado × Planejado" ── esta tabela REUSA a pele da tree do RxP (`realizado-table.css.ts`):
 * fundos por nível (childBg1/childBg2), nó-folha (ring dot), chevron, coluna sticky e cabeçalho `thead2`. As
 * classes compartilhadas são RE-EXPORTADAS daqui (padrão sibling: mesma identidade visual, zero duplicação de
 * estilo, RxP intacto). As cores das 3 medidas + o subtítulo de total do fornecedor entram por `styleVariants`
 * sobre `brand.color.posicao.*`. px/hex crus NÃO entram aqui.
 */
import { style, styleVariants } from '@vanilla-extract/css'

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

// 4 colunas: nome (árvore, sticky, largura fixa p/ o sticky) + 3 medidas (piso legível, fr distribui a folga).
export const gridCols = style({
  gridTemplateColumns: '22rem repeat(3, minmax(8rem, 1fr))',
})

// Empilha nome + subtítulo (total do fornecedor) dentro da célula sticky (colFirst é flex-row → este é o
// item de coluna à direita do chevron/nó-folha).
export const nameStack = style({
  display: 'flex',
  flexDirection: 'column',
  gap: brand.space.xxs,
  minInlineSize: 0,
})
// Subtítulo com o TOTAL do fornecedor (padrão do print) — pequeno, tabular, tinta suave.
export const nameSub = style({
  fontSize: brand.text.hint,
  fontWeight: brand.weight.medium,
  color: brand.color.posicao.total,
  fontVariantNumeric: 'tabular-nums',
})

// Cor do texto de cada medida (aplicada por classe — as views não importam tokens).
export const measureTone = styleVariants({
  emAtrasoCents: { color: brand.color.posicao.emAtraso, fontWeight: brand.weight.semibold },
  pagoCents: { color: brand.color.posicao.pago, fontWeight: brand.weight.semibold },
  aPagarCents: { color: brand.color.posicao.aPagar, fontWeight: brand.weight.semibold },
})

// Valor ZERO — atenua (cinza) para não competir visualmente com os valores presentes.
export const zeroTone = style({ color: brand.color.ink400, fontWeight: '400' })
