/**
 * RealizadoLineChart — gráfico "Distribuição mensal" (linha suave + área), SVG NATIVO (§VIII: sem lib),
 * reprodução fiel do mock. View BURRA: recebe os 12 pontos (planejado por mês, jan→dez) + as iniciais dos
 * meses e desenha: ~3 gridlines com rótulo "M" (milhões), rótulos de mês no eixo X, a área com gradiente e a
 * linha suavizada (mesma suavização por bézier do mock). A matemática aqui é PRESENTACIONAL (geometria do
 * SVG) — não é regra de domínio (essa fica na ViewModel). Animação: a linha "desenha" via stroke-dashoffset
 * e a área faz fade-in quando `animate` vira true (SSR-safe).
 *
 * Hover (padrão do Dashboard): zonas invisíveis por mês capturam o cursor; a linha-guia vertical + o dot
 * marcam o mês e um TOOLTIP HTML flutuante (card com sombra) mostra o nome do mês + o Planejado em R$. O SVG
 * é esticado (preserveAspectRatio="none" implícito via width 100%), então a posição do tooltip é em % do
 * viewBox (viewBox↔render é linear). UI-state LOCAL (índice do mês) — só apresentação; a ViewModel é pura.
 */
import { useMemo, useState, type ReactNode } from 'react'

import {
  chartRel,
  lineSvg,
  gridLine,
  axisText,
  monthText,
  lineArea,
  areaStopTop,
  areaStopBottom,
  linePath,
  linePathAnimated,
  areaAnimated,
  hoverGuide,
  hoverDot,
  hoverZone,
  tooltip,
  tooltipTitle,
  tooltipRow,
  tooltipName,
  tooltipVal,
  emptyState,
} from './realizado-charts.css.ts'

export type RealizadoLineChartProps = Readonly<{
  /** Valor planejado por mês (jan→dez), em centavos. Deve ter 12 posições. */
  monthlyCents: readonly number[]
  /** Iniciais dos 12 meses (jan→dez), ex.: ["J","F","M",…]. */
  monthInitials: readonly string[]
  /** Nomes/abreviações dos 12 meses (jan→dez) p/ o tooltip, ex.: ["Jan","Fev",…]. */
  monthNames: readonly string[]
  /** Rótulo (i18n) do valor no tooltip, ex.: "Planejado". */
  valueLabel: string
  /** Formatador BRL (cents → "R$ …") passado pela page (formatação não é regra de domínio). */
  formatValue: (cents: number) => string
  /** Rótulo acessível do gráfico (ex.: "Distribuição mensal"). */
  ariaLabel: string
  emptyLabel: string
  animate: boolean
}>

// Geometria do mock (viewBox 460×260).
const VB_W = 460
const VB_H = 260
const X0 = 34
const X1 = 446
const Y0 = 16
const Y1 = 216
const N = 12
const GRID_STEPS = 3
const SMOOTH_R = 8

const xAt = (i: number): number => X0 + i * ((X1 - X0) / (N - 1))

/** Caminho suavizado (arredonda os vértices por bézier quadrática) — igual ao mock. */
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

export function RealizadoLineChart(props: RealizadoLineChartProps): ReactNode {
  // Chave estável da série (o memo depende do conteúdo, não da identidade do array).
  const seriesKey = props.monthlyCents.join(',')

  // UI-state LOCAL do hover: índice do mês sob o cursor. Só apresentação (a ViewModel segue pura).
  const [hover, setHover] = useState<number | null>(null)

  const geom = useMemo(() => {
    const reais = props.monthlyCents.map((c) => c / 100)
    const maxV = Math.max(...reais, 1)
    // Escala do eixo Y: teto arredondado ao milhão acima do máximo (evita a linha colar no topo).
    const ceilM = Math.max(1, Math.ceil(maxV / 1_000_000))
    const yMax = ceilM * 1_000_000
    const yAt = (v: number): number => Y0 + (1 - v / yMax) * (Y1 - Y0)

    const gridlines = Array.from({ length: GRID_STEPS + 1 }, (_, tick) => {
      const v = (yMax * tick) / GRID_STEPS
      return { y: yAt(v), label: `${String(Math.round(v / 1_000_000))}M` }
    })
    const points: readonly (readonly [number, number])[] = reais.map((v, i) => [xAt(i), yAt(v)])
    const line = smoothPath(points)
    const area = `${line} L ${String(X1)} ${String(Y1)} L ${String(X0)} ${String(Y1)} Z`
    return { gridlines, line, area, maxV, points }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesKey])

  if (props.monthlyCents.length === 0 || geom.maxV <= 0) {
    return <p className={emptyState}>{props.emptyLabel}</p>
  }

  // Comprimento aproximado do traçado para a animação de "desenho" (dashoffset).
  const drawLen = 2000

  // Ponto do mês sob o cursor (geometria do SVG) → posição do tooltip em % do viewBox (o SVG é esticado).
  const hoverPt = hover !== null ? geom.points[hover] : undefined
  const tip =
    hover !== null && hoverPt !== undefined
      ? {
          left: Math.min(90, Math.max(10, (hoverPt[0] / VB_W) * 100)),
          top: (hoverPt[1] / VB_H) * 100,
        }
      : null

  // Largura da zona de hover invisível (metade do passo p/ cada lado do ponto).
  const step = (X1 - X0) / (N - 1)

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
          <linearGradient id="rxpLineFill" x1="0" y1="0" x2="0" y2="1">
            <stop className={areaStopTop} offset="0%" />
            <stop className={areaStopBottom} offset="100%" />
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
          {props.monthInitials.map((label, i) => (
            <text key={String(i)} className={monthText} x={xAt(i)} y={Y1 + 18} textAnchor="middle">
              {label}
            </text>
          ))}
        </g>

        <path
          className={`${lineArea} ${props.animate ? areaAnimated : ''}`}
          d={geom.area}
          style={{ opacity: props.animate ? 1 : 0 }}
        />
        <path
          className={`${linePath} ${props.animate ? linePathAnimated : ''}`}
          d={geom.line}
          strokeDasharray={drawLen}
          strokeDashoffset={props.animate ? 0 : drawLen}
        />

        {/* Linha-guia vertical + dot no mês sob o cursor. */}
        {hover !== null && hoverPt !== undefined && (
          <g aria-hidden>
            <line className={hoverGuide} x1={hoverPt[0]} y1={Y0} x2={hoverPt[0]} y2={Y1} />
            <circle className={hoverDot} cx={hoverPt[0]} cy={hoverPt[1]} r={4} />
          </g>
        )}

        {/* Zonas de hover invisíveis (uma por mês) — capturam o cursor p/ o tooltip. */}
        {props.monthInitials.map((_, i) => (
          <rect
            key={`hz-${String(i)}`}
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

      {/* Tooltip flutuante (HTML sobreposto): mês + valor Planejado em R$. */}
      {hover !== null && tip !== null && (
        <div
          className={tooltip}
          style={{ left: `${String(tip.left)}%`, top: `${String(tip.top)}%` }}
          role="status"
        >
          <div className={tooltipTitle}>{props.monthNames[hover] ?? props.monthInitials[hover]}</div>
          <div className={tooltipRow}>
            <span className={tooltipName}>{props.valueLabel}</span>
            <span className={tooltipVal}>{props.formatValue(props.monthlyCents[hover] ?? 0)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
