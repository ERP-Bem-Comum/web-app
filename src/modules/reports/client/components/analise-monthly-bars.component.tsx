/**
 * AnaliseMonthlyBars — gráfico "Distribuição Mensal" (barras VERTICAIS de VALOR) do relatório "Análise de
 * Pagamentos". View BURRA: recebe as barras já derivadas (rótulo do mês + valor em centavos) + o total e desenha
 * uma coluna por mês, com o valor curto (R$) acima, a barra proporcional ao máximo e o rótulo do mês abaixo.
 * Cor única da marca (por CLASSE — a view não importa tokens). Animação: a altura cresce quando `animate` vira
 * true (CSS transition). Os rótulos de mês já vêm PRONTOS e VÁLIDOS da ViewModel (nunca "Invalid Date").
 *
 * Hover (padrão do Dashboard): passar o mouse por uma coluna mostra um TOOLTIP flutuante (swatch + mês + valor
 * R$ + %). UI-state LOCAL (índice + posição do mouse) — só apresentação; a ViewModel segue pura.
 */
import { useState, type ReactNode } from 'react'

import {
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
  monthlyBarColor,
  monthlySwatch,
  monthlyBarColorRec,
  monthlySwatchRec,
} from './analise-charts.css.ts'

export type MonthlyBar = Readonly<{
  id: string
  /** Rótulo do mês já formatado (ex.: "Jan/26") — sempre válido (vem da ViewModel). */
  label: string
  valueCents: number
}>

export type AnaliseMonthlyBarsProps = Readonly<{
  bars: readonly MonthlyBar[]
  /** Total do período (denominador da % no tooltip). */
  totalCents: number
  emptyLabel: string
  animate: boolean
  /** Formatador BRL curto (cents → "R$ …") passado pela page (formatação não é regra de domínio). */
  formatValue: (cents: number) => string
  /** Formata a % de participação (valor / total). */
  formatShare: (valueCents: number, totalCents: number) => string
  /** Cor das barras: `'pag'` (padrão, ciano) ou `'rec'` (roxo — Análise de Recebimentos). */
  tone?: 'pag' | 'rec'
}>

export function AnaliseMonthlyBars(props: AnaliseMonthlyBarsProps): ReactNode {
  const [hover, setHover] = useState<{ index: number; x: number; y: number } | null>(null)

  if (props.bars.length === 0) {
    return <p className={emptyState}>{props.emptyLabel}</p>
  }

  const isRec = props.tone === 'rec'
  const barColor = isRec ? monthlyBarColorRec : monthlyBarColor
  const swatch = isRec ? monthlySwatchRec : monthlySwatch
  const maxValue = Math.max(1, ...props.bars.map((b) => b.valueCents))
  const active = hover !== null ? props.bars[hover.index] : undefined

  return (
    <div
      className={chartRel}
      onMouseLeave={() => {
        setHover(null)
      }}
    >
      <div className={vbars}>
        {props.bars.map((b, i) => {
          // Altura = valor / máximo (0 quando não animado). Clamp defensivo.
          const heightPct = props.animate ? Math.max(0, Math.min(100, (b.valueCents / maxValue) * 100)) : 0
          return (
            <div
              key={b.id}
              className={vbarCol}
              onMouseMove={(e) => {
                const rect = e.currentTarget.parentElement?.parentElement?.getBoundingClientRect()
                if (!rect) return
                setHover({ index: i, x: e.clientX - rect.left, y: e.clientY - rect.top })
              }}
            >
              <span className={vbarCount}>{props.formatValue(b.valueCents)}</span>
              <span className={vbarTrack}>
                <span className={`${vbarFill} ${barColor}`} style={{ blockSize: `${String(heightPct)}%` }} />
              </span>
              <span className={vbarLabel} title={b.label}>
                {b.label}
              </span>
            </div>
          )
        })}
      </div>

      {hover !== null && active !== undefined && (
        <div
          className={tooltip}
          style={{ left: `${String(hover.x)}px`, top: `${String(hover.y)}px` }}
          role="status"
        >
          <div className={tooltipTitle}>
            <span className={`${tooltipSwatch} ${swatch}`} aria-hidden />
            {active.label}
          </div>
          <div className={tooltipRow}>
            <span className={tooltipName}>{props.formatValue(active.valueCents)}</span>
            <span className={tooltipVal}>{props.formatShare(active.valueCents, props.totalCents)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
