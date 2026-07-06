/**
 * EquipeLineChart — gráfico "Quantitativo de Funcionários por Ano" (linha suave + área), SVG NATIVO (§VIII:
 * sem lib), identidade EXATA do gráfico de linha do Realizado × Planejado. View BURRA: recebe os N pontos
 * (contagem por ano) + os rótulos dos anos e desenha gridlines com rótulo inteiro, os anos no eixo X, a área
 * com gradiente e a linha suavizada. A matemática aqui é PRESENTACIONAL (geometria do SVG). Animação: a linha
 * "desenha" e a área faz fade-in quando `animate` vira true (SSR-safe).
 *
 * Hover (padrão do Dashboard): zonas invisíveis por ano capturam o cursor; a linha-guia + o dot marcam o ano e
 * um TOOLTIP flutuante mostra o ano + a contagem. UI-state LOCAL (índice do ano) — só apresentação.
 */
import { useMemo, useState, type ReactNode } from 'react'

import {
  chartRel,
  lineSvg,
  gridLine,
  axisText,
  areaFill,
  linePathAnimated,
  areaAnimated,
  hoverGuide,
  hoverZone,
  tooltip,
  tooltipTitle,
  tooltipRow,
  tooltipName,
  tooltipVal,
  emptyState,
  equipeLinePath,
  equipeLineDot,
  equipeAreaStopTop,
  equipeAreaStopBottom,
  yearText,
} from './equipe-charts.css.ts'

export type EquipeLineChartProps = Readonly<{
  /** Contagem por ano, na ordem crescente dos anos. */
  counts: readonly number[]
  /** Rótulos dos anos (mesma ordem), ex.: ["2019",…,"2025"]. */
  years: readonly string[]
  /** Rótulo (i18n) do valor no tooltip, ex.: "Colaboradores". */
  valueLabel: string
  ariaLabel: string
  emptyLabel: string
  animate: boolean
}>

// Geometria (viewBox 460×260), igual ao gráfico mensal do RxP.
const VB_W = 460
const VB_H = 260
const X0 = 34
const X1 = 446
const Y0 = 16
const Y1 = 216
const GRID_STEPS = 3
const SMOOTH_R = 8

/** Caminho suavizado (arredonda os vértices por bézier quadrática) — igual ao mock do RxP. */
function smoothPath(points: readonly (readonly [number, number])[]): string {
  const first = points[0]
  if (!first) return ''
  let d = `M ${String(first[0])} ${String(first[1])}`
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i - 1]
    const v = points[i]
    const q = points[i + 1]
    if (!p || !v || !q) continue
    const l1 = Math.hypot(p[0] - v[0], p[1] - v[1]) || 1
    const l2 = Math.hypot(q[0] - v[0], q[1] - v[1]) || 1
    const d1 = Math.min(SMOOTH_R, l1 / 2)
    const d2 = Math.min(SMOOTH_R, l2 / 2)
    const ax = (v[0] + ((p[0] - v[0]) / l1) * d1).toFixed(1)
    const ay = (v[1] + ((p[1] - v[1]) / l1) * d1).toFixed(1)
    const bx = (v[0] + ((q[0] - v[0]) / l2) * d2).toFixed(1)
    const by = (v[1] + ((q[1] - v[1]) / l2) * d2).toFixed(1)
    d += ` L ${ax} ${ay} Q ${String(v[0])} ${String(v[1])} ${bx} ${by}`
  }
  const last = points[points.length - 1]
  if (last) d += ` L ${String(last[0])} ${String(last[1])}`
  return d
}

export function EquipeLineChart(props: EquipeLineChartProps): ReactNode {
  const seriesKey = props.counts.join(',')
  const [hover, setHover] = useState<number | null>(null)

  const n = Math.max(1, props.counts.length)
  const xAt = (i: number): number => (n === 1 ? (X0 + X1) / 2 : X0 + i * ((X1 - X0) / (n - 1)))

  const geom = useMemo(() => {
    const values = [...props.counts]
    const maxV = Math.max(...values, 1)
    // Escala do eixo Y: teto inteiro acima do máximo (evita a linha colar no topo).
    const yMax = Math.max(1, maxV)
    const yAt = (v: number): number => Y0 + (1 - v / yMax) * (Y1 - Y0)

    const gridlines = Array.from({ length: GRID_STEPS + 1 }, (_, tick) => {
      const v = (yMax * tick) / GRID_STEPS
      return { y: yAt(v), label: String(Math.round(v)) }
    })
    const points: readonly (readonly [number, number])[] = values.map((v, i) => [xAt(i), yAt(v)])
    const line = smoothPath(points)
    const area = `${line} L ${String(X1)} ${String(Y1)} L ${String(X0)} ${String(Y1)} Z`
    return { gridlines, line, area, maxV, points }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesKey])

  if (props.counts.length === 0 || geom.maxV <= 0) {
    return <p className={emptyState}>{props.emptyLabel}</p>
  }

  const drawLen = 2000
  const hoverPt = hover !== null ? geom.points[hover] : undefined
  const tip =
    hover !== null && hoverPt !== undefined
      ? {
          left: Math.min(90, Math.max(10, (hoverPt[0] / VB_W) * 100)),
          top: (hoverPt[1] / VB_H) * 100,
        }
      : null

  const step = n === 1 ? X1 - X0 : (X1 - X0) / (n - 1)

  return (
    <div
      className={chartRel}
      onMouseLeave={() => {
        setHover(null)
      }}
    >
      <svg
        className={lineSvg}
        viewBox={`0 0 ${String(VB_W)} ${String(VB_H)}`}
        role="img"
        aria-label={props.ariaLabel}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="equipeLineFill" x1="0" y1="0" x2="0" y2="1">
            <stop className={equipeAreaStopTop} offset="0%" />
            <stop className={equipeAreaStopBottom} offset="100%" />
          </linearGradient>
        </defs>

        <g>
          {geom.gridlines.map((g) => (
            <g key={g.label + String(g.y)}>
              <line className={gridLine} x1={X0} y1={g.y} x2={X1} y2={g.y} />
              <text className={axisText} x={X0 - 6} y={g.y + 3} textAnchor="end">
                {g.label}
              </text>
            </g>
          ))}
        </g>

        <g>
          {props.years.map((label, i) => (
            <text key={label} className={yearText} x={xAt(i)} y={Y1 + 18} textAnchor="middle">
              {label}
            </text>
          ))}
        </g>

        <path
          className={`${areaFill} ${props.animate ? areaAnimated : ''}`}
          d={geom.area}
          style={{ opacity: props.animate ? 1 : 0 }}
        />
        <path
          className={`${equipeLinePath} ${props.animate ? linePathAnimated : ''}`}
          d={geom.line}
          strokeDasharray={drawLen}
          strokeDashoffset={props.animate ? 0 : drawLen}
        />

        {hover !== null && hoverPt !== undefined && (
          <g aria-hidden>
            <line className={hoverGuide} x1={hoverPt[0]} y1={Y0} x2={hoverPt[0]} y2={Y1} />
            <circle className={equipeLineDot} cx={hoverPt[0]} cy={hoverPt[1]} r={4} />
          </g>
        )}

        {props.years.map((label, i) => (
          <rect
            key={`hz-${label}`}
            x={xAt(i) - step / 2}
            y={Y0}
            width={step}
            height={Y1 - Y0}
            className={hoverZone}
            onMouseEnter={() => {
              setHover(i)
            }}
          />
        ))}
      </svg>

      {hover !== null && tip !== null && (
        <div
          className={tooltip}
          style={{ left: `${String(tip.left)}%`, top: `${String(tip.top)}%` }}
          role="status"
        >
          <div className={tooltipTitle}>{props.years[hover] ?? ''}</div>
          <div className={tooltipRow}>
            <span className={tooltipName}>{props.valueLabel}</span>
            <span className={tooltipVal}>{props.counts[hover] ?? 0}</span>
          </div>
        </div>
      )}
    </div>
  )
}
