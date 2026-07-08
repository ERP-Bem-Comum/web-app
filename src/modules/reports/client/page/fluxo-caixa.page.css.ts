/**
 * Estilos da page "Fluxo de Caixa" — MOLDE do relatório "Realizado × Planejado" (identidade "brand", full-bleed
 * 28px, só-tokens §X). A pele do cabeçalho, dos filtros recolhíveis, dos KPIs e dos cartões é RE-EXPORTADA de
 * `realizado-x-planejado.page.css.ts` (padrão sibling: mesma identidade, zero duplicação, RxP intacto). Aqui só
 * entram as peças específicas do Fluxo de Caixa: a BARRA DE ACENTO dos KPIs (Saídas/Entradas/Saldo), a grade de
 * UM gráfico e o empilhamento das 2 seções (Saídas / Entradas). Nenhum hex/px cru.
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
// Trigger do dropdown Exportar (kit brand compartilhado dos relatórios).
export { exportTrigger } from '../components/report-filters.css.ts'

import { kpi } from './realizado-x-planejado.page.css.ts'

// Barra de cor à esquerda de cada KPI do Fluxo (Saídas âmbar · Entradas verde · Saldo azul/vermelho). Por CLASSE.
export const kpiAccentFluxo = styleVariants({
  saidas: { selectors: { [`${kpi}&::before`]: { background: brand.color.fluxo.saida } } },
  entradas: { selectors: { [`${kpi}&::before`]: { background: brand.color.fluxo.entrada } } },
  saldoPos: { selectors: { [`${kpi}&::before`]: { background: brand.color.fluxo.saldoPos } } },
  saldoNeg: { selectors: { [`${kpi}&::before`]: { background: brand.color.fluxo.saldoNeg } } },
})

// Valor do KPI de Saldo colorido por sinal (positivo verde / negativo vermelho). Aplicado por CLASSE no <span>.
export const saldoValueTone = styleVariants({
  pos: { color: brand.color.fluxo.saldoPos },
  neg: { color: brand.color.fluxo.saldoNeg },
})

// Grade dos QUATRO gráficos numa linha só (compactos e ALINHADOS): Linha do tempo · Centro de Custo · Entradas
// · Saídas. Cards de altura igual (`stretch`). Colapsa 4→2 (≤75rem) e 2→1 (≤48rem) para não espremer.
export const charts4 = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: brand.space.gridRow,
  marginBlockEnd: brand.space.gridRow,
  alignItems: 'stretch',
  '@media': {
    'screen and (max-width: 75rem)': { gridTemplateColumns: '1fr 1fr' },
    'screen and (max-width: 48rem)': { gridTemplateColumns: '1fr' },
  },
})

// Empilhamento das 2 seções (Saídas / Entradas) com o mesmo respiro do grid.
export const sections = style({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: brand.space.gridRow,
})
