/**
 * Estilos da page "Fluxo de Caixa" — MOLDE do relatório "Realizado × Planejado" (identidade "brand", full-bleed
 * 28px, só-tokens §X). A pele do cabeçalho, dos filtros recolhíveis, dos KPIs e dos cartões é RE-EXPORTADA de
 * `realizado-x-planejado.page.css.ts` (padrão sibling: mesma identidade, zero duplicação, RxP intacto). Aqui só
 * entram as peças específicas do Fluxo de Caixa: a BARRA DE ACENTO dos KPIs (Saídas/Entradas/Saldo), a grade de
 * UM gráfico e o empilhamento das 2 seções (Saídas / Entradas). Nenhum hex/px cru.
 */
import { style, styleVariants } from '@vanilla-extract/css'

import { brand } from '#shared/ui/brand/grid-brand.values.ts'
import { vars } from '#shared/ui/tokens/index.ts'

import { fldSelect as fldSelectStyle } from './realizado-x-planejado.page.css.ts'

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
  kpiDot,
  kpiLabel,
  kpiValue,
  kpiSub,
} from './realizado-x-planejado.page.css.ts'
// Trigger do dropdown Exportar (kit brand compartilhado dos relatórios).
export { exportTrigger } from '../components/report-filters.css.ts'

// Cor da BOLINHA de cada KPI do Fluxo (Saídas vermelho · Entradas verde · Saldo verde/vermelho). Aplicada ao
// `kpiDot`. Saídas usa o VERMELHO da família (saldoNeg) p/ bater com o print (dinheiro que sai = vermelho,
// como os negativos); o âmbar `fluxo.saida` segue nos GRÁFICOS de saída (donut/barras), não no KPI.
export const kpiAccentFluxo = styleVariants({
  saidas: { background: brand.color.fluxo.saldoNeg },
  entradas: { background: brand.color.fluxo.entrada },
  saldoPos: { background: brand.color.fluxo.saldoPos },
  saldoNeg: { background: brand.color.fluxo.saldoNeg },
})

// Valor colorido por semântica de fluxo: Entradas (dinheiro que entra) verde · Saídas (que sai) vermelho (print).
export const kpiValueToneFluxo = styleVariants({
  entradas: { color: brand.color.fluxo.entrada },
  saidas: { color: brand.color.fluxo.saldoNeg },
})

// Valor do KPI de Saldo colorido por sinal (positivo verde / negativo vermelho). Aplicado por CLASSE no <span>.
export const saldoValueTone = styleVariants({
  pos: { color: brand.color.fluxo.saldoPos },
  neg: { color: brand.color.fluxo.saldoNeg },
})

// Card de Saldo TINTADO quando NEGATIVO (resultado do período no vermelho) — fundo vermelho suave + divisória
// própria (tom + forte do tint) p/ a linha aparecer entre dois cards tintados adjacentes (some contra o cinza).
export const kpiTintNeg = style({
  background: brand.color.fluxo.saldoNegTintBg,
  borderInlineStart: `${vars.borderWidth.thin} solid ${brand.color.fluxo.saldoNegTintLine}`,
})

// Grade dos QUATRO gráficos numa linha só (compactos e ALINHADOS): Linha do tempo · Centro de Custo · Entradas
// · Saídas. Cards de altura igual (`stretch`). Colapsa 4→2 (≤75rem) e 2→1 (≤48rem) para não espremer. O eixo de
// Centro de Custo é RECONSTRUÍDO pelo BFF via fan-out (o #590 não o expõe nativamente — CA6).
export const charts4 = style({
  display: 'grid',
  // A "Linha do tempo" (eixo X com muitos meses) ganha mais largura; os donuts Entradas/Saídas
  // (compactos) cedem espaço — evita a sobreposição dos rótulos de mês sem espremer nada.
  gridTemplateColumns: '1.7fr 1.3fr 1fr 1fr',
  gap: brand.space.gridRow,
  marginBlockEnd: brand.space.gridRow,
  alignItems: 'stretch',
  '@media': {
    'screen and (max-width: 75rem)': { gridTemplateColumns: '1fr 1fr' },
    'screen and (max-width: 48rem)': { gridTemplateColumns: '1fr' },
  },
})

// Período de vencimento: DOIS inputs de data (De / Até) lado a lado (no lugar de um dropdown).
export const periodRow = style({ display: 'flex', gap: brand.space.sm, alignItems: 'flex-end' })

// Input de data com a MESMA pele do select (fldSelect), sem o chevron (é campo de texto, não dropdown).
export const dateInput = style([
  fldSelectStyle,
  { minInlineSize: '8rem', paddingInlineEnd: brand.space.md, cursor: 'text' },
])
