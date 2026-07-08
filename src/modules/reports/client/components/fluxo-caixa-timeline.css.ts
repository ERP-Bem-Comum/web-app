/**
 * Estilos do gráfico "Linha do tempo" do "Fluxo de Caixa" — 3 séries (Previsto ciano · Realizado verde · Saldo
 * verde-claro) ao longo do tempo, SVG NATIVO (§VIII: sem lib), identidade "brand", só-tokens (§X). Reaproveita a
 * base do relatório "Realizado × Planejado" (âncora relativa, tooltip, SVG/grid/eixo, hover) e a legenda do
 * gráfico de barras do Fluxo — ZERO duplicação. O específico daqui (as 3 cores de linha/legenda + a linha de
 * base zero) fica neste arquivo; a view aplica por CLASSE (não importa tokens; boundary client-ui ↛ ds-tokens).
 */
import { style, styleVariants } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

// Base do SVG (âncora, tooltip, grid/eixo, hover, empty-state) do relatório "Realizado × Planejado".
export {
  chartRel,
  tooltip,
  tooltipTitle,
  tooltipRow,
  tooltipName,
  tooltipVal,
  tooltipSwatch,
  lineSvg,
  gridLine,
  axisText,
  monthText,
  hoverGuide,
  hoverZone,
  emptyState,
} from './realizado-charts.css.ts'

// Legenda (3 séries) reaproveitada do gráfico de barras agrupadas do Fluxo.
export { legend, legendItem, legendSwatch } from './fluxo-caixa-monthly-bars.css.ts'

// Linha de base do zero (Saldo pode negativar) — traço contínuo mais firme que a gridline pontilhada.
export const zeroLine = style({
  stroke: brand.color.line,
  strokeWidth: vars.borderWidth.thin,
})

// Traçado de cada série — cor por CLASSE. Previsto ciano, Realizado verde, Saldo verde-claro.
const linePathBase = {
  fill: 'none' as const,
  strokeWidth: brand.rxp.lineStroke,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}
export const lineTone = styleVariants({
  previsto: { ...linePathBase, stroke: brand.color.fluxo.previstoChart },
  realizado: { ...linePathBase, stroke: brand.color.fluxo.realizadoChart },
  saldo: { ...linePathBase, stroke: brand.color.fluxo.saldoLine },
})

// Ao animar, a linha "desenha" (dashoffset → 0).
export const linePathAnimated = style({ transition: 'stroke-dashoffset .7s ease-out' })

// Dot da série sob o cursor (mesma cor da linha), por CLASSE.
export const dotTone = styleVariants({
  previsto: { fill: brand.color.fluxo.previstoChart },
  realizado: { fill: brand.color.fluxo.realizadoChart },
  saldo: { fill: brand.color.fluxo.saldoLine },
})

// Swatch da legenda/tooltip por série, por CLASSE.
export const swatchTone = styleVariants({
  previsto: { background: brand.color.fluxo.previstoChart },
  realizado: { background: brand.color.fluxo.realizadoChart },
  saldo: { background: brand.color.fluxo.saldoLine },
})
