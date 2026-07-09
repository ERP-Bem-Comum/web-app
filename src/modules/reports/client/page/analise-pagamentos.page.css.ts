/**
 * Estilos da page "Análise de Pagamentos" — identidade "brand", só-tokens (§X). Reaproveita INTEGRALMENTE a
 * pele da page do Realizado × Planejado (cabeçalho, filtros recolhíveis, cartão de gráfico) via re-export
 * abaixo — mesma identidade, zero duplicação. O único estilo próprio é a GRADE de 2 gráficos (`charts2`).
 */
import { style } from '@vanilla-extract/css'

import { brand } from '#shared/ui/brand/grid-brand.values.ts'

// Reusa o layout do relatório Realizado × Planejado (cabeçalho + filtros recolhíveis + cartão de gráfico).
export {
  head,
  backButton,
  headTitle,
  tools,
  filterToggle,
  filters,
  filtersInner,
  fld,
  fldLabel,
  fldCtrl,
  fldSelect,
  fldChev,
  applyButton,
  card,
  chartCard,
  chartPad,
  cardHeader,
  cardTitle,
} from './realizado-x-planejado.page.css.ts'

// Empty state HONESTO (relatório vazio: 0 planos / total 0) — reusa a pele já criada na "Posição" (cartão
// centralizado, sem gráficos/tabela quebrados). Zero duplicação; é o caminho da Análise de Recebimentos
// quando o placeholder for removido (fonte `[]`).
export { emptyPanel, emptyTitle, emptyHint } from './posicao-pagamentos.page.css.ts'

// ── Grade de 2 gráficos (Distribuição por Centro de Custo + Distribuição Mensal) ──
export const charts2 = style({
  display: 'grid',
  gridTemplateColumns: '1.1fr 1fr',
  gap: brand.space.gridRow,
  marginBlockEnd: brand.space.gridRow,
  alignItems: 'stretch',
  '@media': { 'screen and (max-width: 75rem)': { gridTemplateColumns: '1fr' } },
})
