/**
 * Estilos do gráfico "Distribuição Mensal" do relatório "Análise de Pagamentos" — barras VERTICAIS de VALOR
 * (money), identidade "brand", só-tokens (§X). Reaproveita a geometria das barras verticais + o tooltip
 * flutuante do relatório "Equipe ABC" (re-export abaixo → que por sua vez reusa o Realizado × Planejado) para
 * manter a identidade EXATA, ZERO duplicação. O que é específico daqui (a cor única de valor da barra) fica
 * neste arquivo — a view aplica por CLASSE (não importa tokens; boundary client-ui ↛ ds-tokens).
 */
import { style } from '@vanilla-extract/css'

import { brand } from '#shared/ui/brand/grid-brand.values.ts'

// Reusa a base (âncora relativa, tooltip, barras verticais, empty-state) do relatório "Equipe ABC".
export {
  chartRel,
  tooltip,
  tooltipTitle,
  tooltipRow,
  tooltipName,
  tooltipVal,
  tooltipSwatch,
  vbars,
  vbarCol,
  vbarCount,
  vbarTrack,
  vbarFill,
  vbarLabel,
  emptyState,
} from './equipe-charts.css.ts'

// Cor única do fill das barras mensais (valor) — CIANO da marca, distinto do azul institucional das barras
// "Distribuição por Centro de Custo" (dois gráficos na mesma tela não repetem a cor). Aplicada por CLASSE junto
// do `vbarFill` (que carrega a geometria: largura/raio/transição). Um swatch idêntico para o tooltip.
export const monthlyBarColor = style({ background: brand.color.analise.monthBar })
export const monthlySwatch = style({ background: brand.color.analise.monthBar })

// Variante de RECEBIMENTOS (espelho) — ROXO suave, família DISTINTA da de Pagamentos (a P.O. pede diferenciar
// as duas telas pela cor dos gráficos). Aplicada por CLASSE, do mesmo modo — sem tocar a de Pagamentos.
export const monthlyBarColorRec = style({ background: brand.color.analise.monthBarRec })
export const monthlySwatchRec = style({ background: brand.color.analise.monthBarRec })
