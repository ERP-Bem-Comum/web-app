/**
 * Estilos do gráfico "Fluxo por vencimento" do "Fluxo de Caixa" — barras VERTICAIS AGRUPADAS (Entradas ×
 * Saídas por mês), identidade "brand", só-tokens (§X). Reaproveita a âncora relativa + o tooltip flutuante do
 * relatório "Equipe ABC" (que por sua vez reusa o Realizado × Planejado) para manter a identidade EXATA, ZERO
 * duplicação. O específico daqui (as 2 cores Entrada/Saída + o layout de PAR de barras por mês + a legenda) fica
 * neste arquivo — a view aplica por CLASSE (não importa tokens; boundary client-ui ↛ ds-tokens).
 */
import { style, styleVariants } from '@vanilla-extract/css'

import { brand } from '#shared/ui/brand/grid-brand.values.ts'

// Reusa a base (âncora relativa, tooltip, empty-state) do relatório "Equipe ABC".
export {
  chartRel,
  tooltip,
  tooltipTitle,
  tooltipRow,
  tooltipName,
  tooltipVal,
  tooltipSwatch,
  emptyState,
} from './equipe-charts.css.ts'

// Legenda (2 itens: Entradas / Saídas) no topo do gráfico.
export const legend = style({
  display: 'flex',
  gap: brand.space.gridCol,
  justifyContent: 'center',
  marginBlockEnd: brand.space.gridRow,
  flexWrap: 'wrap',
})
export const legendItem = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: brand.space.xs,
  fontSize: brand.text.label,
  fontWeight: brand.weight.semibold,
  color: brand.color.ink700,
})
export const legendSwatch = style({
  inlineSize: '0.75rem',
  blockSize: '0.75rem',
  borderRadius: brand.radius.xs,
  flexShrink: 0,
})

// Linha de grupos-mês (cada grupo = um par de barras + rótulo do mês).
export const groups = style({
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-around',
  gap: brand.space.sm,
  // Área do plot mais baixa: os 4 gráficos ficam numa linha só (compactos e alinhados).
  blockSize: '10rem',
})
export const group = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: brand.space.xs,
  flex: 1,
  minInlineSize: 0,
  blockSize: '100%',
})
// Par de barras (Entrada + Saída) que cresce da base.
export const pair = style({
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  gap: brand.space.xxs,
  flex: 1,
  inlineSize: '100%',
  minBlockSize: 0,
})
export const barCol = style({
  inlineSize: '42%',
  maxInlineSize: '1.5rem',
  blockSize: '100%',
  display: 'flex',
  alignItems: 'flex-end',
})
export const barFill = style({
  inlineSize: '100%',
  borderStartStartRadius: brand.radius.xs,
  borderStartEndRadius: brand.radius.xs,
  transition: 'block-size .5s ease',
  minBlockSize: '0.125rem',
})
// Cor por série — aplicada por CLASSE junto de `barFill`. O gráfico "por vencimento" usa Entradas verde /
// Saídas âmbar; o gráfico "Agrupado por Centro de Custo" usa Previsto ciano / Realizado verde (espelho legado).
export const barTone = styleVariants({
  entrada: { background: brand.color.fluxo.entrada },
  saida: { background: brand.color.fluxo.saida },
  previsto: { background: brand.color.fluxo.previstoChart },
  realizado: { background: brand.color.fluxo.realizadoChart },
})
export const swatchTone = styleVariants({
  entrada: { background: brand.color.fluxo.entrada },
  saida: { background: brand.color.fluxo.saida },
  previsto: { background: brand.color.fluxo.previstoChart },
  realizado: { background: brand.color.fluxo.realizadoChart },
})
export const monthLabel = style({
  fontSize: brand.text.thead,
  fontWeight: brand.weight.medium,
  color: brand.color.ink500,
  whiteSpace: 'nowrap',
})
