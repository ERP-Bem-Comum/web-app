/**
 * LineChart — view BURRA (§XI) em SVG NATIVO (§VIII: sem lib nova). Parametrizável: recebe 2 séries de
 * pontos, o máximo do eixo Y e os ticks (gridlines) por props; desenha eixo X Jan..Dez, eixo Y R$0..R$18k,
 * gridlines pontilhadas horizontais e uma polyline por série. As cores das séries/grid/eixo vêm de CLASSES
 * de token (§boundaries: client-ui ↛ ds-tokens; o mapeamento cor→token vive no .css.ts). Pronto p/ dados
 * reais: basta trocar `series`/`yMax`/`yTicks`.
 */
import { useState, type ReactNode } from 'react'

import type { ChartSeries } from '../dashboard-summary.view-model.ts'
import {
  wrap,
  chartArea,
  svgEl,
  monthLabel,
  yLabel,
  gridLine,
  axisLine,
  seriesStroke,
  seriesPath,
  seriesPathDelayed,
  seriesSwatchColor,
  seriesDotFill,
  tooltip,
  tooltipMonth,
  tooltipRow,
  tooltipSwatch,
  tooltipName,
  tooltipVal,
} from './line-chart.css.ts'

// viewBox em unidades abstratas (o SVG escala responsivo via CSS). Padding p/ os rótulos dos eixos.
const VB_W = 640
const VB_H = 320
const PAD_LEFT = 56
const PAD_RIGHT = 16
const PAD_TOP = 16
const PAD_BOTTOM = 32
const PLOT_W = VB_W - PAD_LEFT - PAD_RIGHT
const PLOT_H = VB_H - PAD_TOP - PAD_BOTTOM

// Rótulo do eixo Y — escala em MILHÕES (R$Xm), fiel ao legado (R$0/R$4.5M/…/R$18M).
const formatAxis = (value: number): string =>
  value === 0 ? 'R$0' : `R$${(value / 1_000_000).toLocaleString('pt-BR')}M`

// Valor no tooltip — BRL completo com centavos (ex.: "R$ 8.900.000,00").
const formatBRL = (value: number): string =>
  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

type Pt = Readonly<{ x: number; y: number }>

// Path suave (Catmull-Rom → Bézier cúbica). `K` = fração da distância entre vizinhos que vira o vetor de
// controle: quanto MENOR, menos "boleado" (mais perto de reta, com cantos só levemente arredondados).
const K = 0.11
const smoothPath = (pts: readonly Pt[]): string => {
  const first = pts[0]
  if (first === undefined) return ''
  if (pts.length < 3) {
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${String(p.x)} ${String(p.y)}`).join(' ')
  }
  let d = `M ${String(first.x)} ${String(first.y)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    if (p0 === undefined || p1 === undefined || p2 === undefined || p3 === undefined) continue
    const cp1x = p1.x + (p2.x - p0.x) * K
    const cp1y = p1.y + (p2.y - p0.y) * K
    const cp2x = p2.x - (p3.x - p1.x) * K
    const cp2y = p2.y - (p3.y - p1.y) * K
    d += ` C ${String(cp1x)} ${String(cp1y)}, ${String(cp2x)} ${String(cp2y)}, ${String(p2.x)} ${String(p2.y)}`
  }
  return d
}

export type LineChartProps = Readonly<{
  series: readonly ChartSeries[]
  yMax: number
  yTicks: readonly number[]
  months: number
  /** rótulos dos 12 meses (Jan..Dez), já traduzidos */
  monthLabels: readonly string[]
  /** rótulo de série (id → texto i18n), p/ a legenda */
  seriesLabel: (series: ChartSeries) => string
}>

export function LineChart(props: LineChartProps): ReactNode {
  const { series, yMax, yTicks, months, monthLabels } = props

  // UI-state LOCAL (hover do mês) — só apresentação; o núcleo (view-model) segue agnóstico de React.
  const [hover, setHover] = useState<number | null>(null)

  const xFor = (month: number): number =>
    months <= 1 ? PAD_LEFT : PAD_LEFT + (month / (months - 1)) * PLOT_W
  const yFor = (v: number): number => PAD_TOP + PLOT_H - (Math.min(v, yMax) / yMax) * PLOT_H

  const band = months <= 1 ? PLOT_W : PLOT_W / (months - 1)

  // Posição do tooltip (em % da área do gráfico — o SVG é esticado, então viewBox↔render é linear).
  const tip = ((): { left: number; top: number } | null => {
    if (hover === null) return null
    const left = (xFor(hover) / VB_W) * 100
    const topValue = Math.max(...series.map((s) => s.points[hover]?.value ?? 0))
    const top = (yFor(topValue) / VB_H) * 100
    return { left: Math.min(88, Math.max(12, left)), top }
  })()

  return (
    <div className={wrap}>
      <div
        className={chartArea}
        onMouseLeave={() => {
          setHover(null)
        }}
      >
        <svg
          className={svgEl}
          viewBox={`0 0 ${String(VB_W)} ${String(VB_H)}`}
          role="img"
          aria-label={series.map(props.seriesLabel).join(' / ')}
          preserveAspectRatio="none"
        >
          {/* gridlines pontilhadas horizontais + rótulos do eixo Y */}
          {yTicks.map((tick) => {
            const y = yFor(tick)
            return (
              <g key={`tick-${String(tick)}`}>
                <line
                  className={gridLine}
                  x1={PAD_LEFT}
                  y1={y}
                  x2={VB_W - PAD_RIGHT}
                  y2={y}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
                <text className={yLabel} x={PAD_LEFT - 8} y={y} textAnchor="end" dominantBaseline="middle">
                  {formatAxis(tick)}
                </text>
              </g>
            )
          })}

          {/* linhas SÓLIDAS dos eixos (o "L"): Y à esquerda, X na base */}
          <line
            className={axisLine}
            x1={PAD_LEFT}
            y1={PAD_TOP}
            x2={PAD_LEFT}
            y2={PAD_TOP + PLOT_H}
            strokeWidth={1}
          />
          <line
            className={axisLine}
            x1={PAD_LEFT}
            y1={PAD_TOP + PLOT_H}
            x2={VB_W - PAD_RIGHT}
            y2={PAD_TOP + PLOT_H}
            strokeWidth={1}
          />

          {/* rótulos do eixo X (Jan..Dez) */}
          {monthLabels.slice(0, months).map((m, i) => (
            <text key={`m-${m}`} className={monthLabel} x={xFor(i)} y={VB_H - 8} textAnchor="middle">
              {m}
            </text>
          ))}

          {/* uma linha SUAVE por série (com animação de "desenho" na entrada) */}
          {series.map((s, si) => (
            <path
              key={s.id}
              className={`${seriesStroke[s.id]} ${si === 0 ? seriesPath : seriesPathDelayed}`}
              d={smoothPath(s.points.map((p) => ({ x: xFor(p.month), y: yFor(p.value) })))}
              pathLength={1}
              fill="none"
              strokeWidth={1.75}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {/* linha-guia + dots da série no mês sob o cursor */}
          {hover !== null && (
            <g aria-hidden>
              <line
                className={gridLine}
                x1={xFor(hover)}
                y1={PAD_TOP}
                x2={xFor(hover)}
                y2={PAD_TOP + PLOT_H}
                strokeWidth={1}
              />
              {series.map((s) => (
                <circle
                  key={`dot-${s.id}`}
                  className={seriesDotFill[s.id]}
                  cx={xFor(hover)}
                  cy={yFor(s.points[hover]?.value ?? 0)}
                  r={4}
                />
              ))}
            </g>
          )}

          {/* zonas de hover invisíveis (uma por mês) — capturam o cursor p/ o tooltip */}
          {monthLabels.slice(0, months).map((m, i) => (
            <rect
              key={`hz-${m}`}
              x={xFor(i) - band / 2}
              y={PAD_TOP}
              width={band}
              height={PLOT_H}
              fill="transparent"
              onMouseEnter={() => {
                setHover(i)
              }}
            />
          ))}
        </svg>

        {/* tooltip no hover (HTML sobreposto): mês + valor de cada série */}
        {hover !== null && tip !== null && (
          <div
            className={tooltip}
            style={{ left: `${String(tip.left)}%`, top: `${String(tip.top)}%` }}
            role="status"
          >
            <div className={tooltipMonth}>{monthLabels[hover]}</div>
            {series.map((s) => (
              <div key={`tt-${s.id}`} className={tooltipRow}>
                <span className={`${tooltipSwatch} ${seriesSwatchColor[s.id]}`} aria-hidden />
                <span className={tooltipName}>{props.seriesLabel(s)}</span>
                <span className={tooltipVal}>{formatBRL(s.points[hover]?.value ?? 0)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
