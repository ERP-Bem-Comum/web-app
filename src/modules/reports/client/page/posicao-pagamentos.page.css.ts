/**
 * Estilos da page "Posição de Pagamentos" — MOLDE do relatório "Realizado × Planejado" (identidade "brand",
 * full-bleed 28px, só-tokens §X). A pele do cabeçalho, dos filtros recolhíveis, dos KPIs e dos cartões de
 * gráfico é RE-EXPORTADA de `realizado-x-planejado.page.css.ts` (padrão sibling: mesma identidade, zero
 * duplicação, RxP intacto). Aqui só entram as duas peças específicas da Posição: a BARRA DE ACENTO dos KPIs na
 * paleta das 3 medidas + Total (vermelho/verde/âmbar/azul) e a grade de DOIS gráficos. Nenhum hex/px cru.
 */
import { style, styleVariants } from '@vanilla-extract/css'

import { brand } from '#shared/ui/brand/grid-brand.values.ts'

// Pele compartilhada do RxP (cabeçalho + filtros + cartões + KPIs) — re-export para a page importar tudo daqui.
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
  cardHeader,
  cardTitle,
  chartCard,
  chartPad,
  kpis,
  kpi,
  kpiLabel,
  kpiValue,
  kpiSub,
} from './realizado-x-planejado.page.css.ts'

import { kpi } from './realizado-x-planejado.page.css.ts'

// Barra de cor à esquerda de cada KPI da Posição (paleta das 3 medidas + Total). Aplicada por CLASSE.
export const kpiAccentPosicao = styleVariants({
  atrasado: { selectors: { [`${kpi}&::before`]: { background: brand.color.posicao.emAtraso } } },
  pago: { selectors: { [`${kpi}&::before`]: { background: brand.color.posicao.pago } } },
  aPagar: { selectors: { [`${kpi}&::before`]: { background: brand.color.posicao.aPagar } } },
  total: { selectors: { [`${kpi}&::before`]: { background: brand.color.posicao.total } } },
})

// Grade de DOIS gráficos: "Resumo total" (donut, mais estreito) + "Distribuição por Fornecedor" (barras, mais
// largo p/ os nomes longos). Colapsa em 1 coluna em telas estreitas.
export const charts2 = style({
  display: 'grid',
  gridTemplateColumns: '0.85fr 1.15fr',
  gap: brand.space.gridRow,
  marginBlockEnd: brand.space.gridRow,
  alignItems: 'stretch',
  '@media': { 'screen and (max-width: 75rem)': { gridTemplateColumns: '1fr' } },
})
