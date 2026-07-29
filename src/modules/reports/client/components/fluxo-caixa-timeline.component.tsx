/**
 * FluxoCaixaTimeline — gráfico "Linha do tempo" do "Fluxo de Caixa": 3 séries (Previsto/Esperado ciano ·
 * Realizado verde · Saldo verde-claro) ao longo do TEMPO (eixo X = períodos por vencimento), SVG NATIVO
 * (§VIII: sem lib). View BURRA: recebe os pontos já derivados (ViewModel pura `buildTimeline`) + os rótulos
 * das séries (i18n) + os formatadores BRL e desenha gridlines (com a BASE ZERO, porque o Saldo pode negativar),
 * os rótulos de período no eixo X, e as 3 linhas suavizadas. A matemática aqui é PRESENTACIONAL (geometria do
 * SVG) — a regra de domínio fica na ViewModel. Cores por CLASSE (a view não importa tokens).
 *
 * ⚠️ Os rótulos de período (eixo X / tooltip) vêm PRONTOS e VÁLIDOS da ViewModel (`formatMonthLabel`, por
 * ÍNDICE) — jamais construídos aqui a partir de uma string de data (bug "Invalid Date" do legado que não
 * reproduzimos). A view não instancia `Date`.
 *
 * Hover (padrão do Dashboard): zonas invisíveis por período capturam o cursor; a linha-guia vertical + os dots
 * marcam o período e um TOOLTIP flutuante mostra as 3 séries em R$. UI-state LOCAL (índice) — só apresentação.
 */
import { useMemo, useState, type ReactNode } from 'react'

import type { TimelinePoint } from '../fluxo-caixa.view-model.ts'
import {
  chartRel,
  lineSvg,
  gridLine,
  axisText,
  monthText,
  hoverGuide,
  hoverZone,
  tooltip,
  tooltipTitle,
  tooltipRow,
  tooltipName,
  tooltipVal,
  tooltipSwatch,
  emptyState,
  legend,
  legendItem,
  legendSwatch,
  zeroLine,
  lineTone,
  linePathAnimated,
  dotTone,
  swatchTone,
} from './fluxo-caixa-timeline.css.ts'

type SeriesKey = 'previsto' | 'realizado' | 'saldo'

export type FluxoCaixaTimelineProps = Readonly<{
  points: readonly TimelinePoint[]
  emptyLabel: string
  animate: boolean
  /** Rótulos das 3 séries (i18n). */
  labels: Readonly<{ previsto: string; realizado: string; saldo: string }>
  ariaLabel: string
  /** Formatador BRL completo (tooltip). */
  formatValue: (cents: number) => string
  /** Formatador BRL curto (rótulos do eixo Y). */
  formatAxis: (cents: number) => string
}>

// Geometria (viewBox 460×260), igual aos demais gráficos de linha.
const VB_W = 460
const VB_H = 260
const X0 = 34
const X1 = 446
const Y0 = 16
const Y1 = 216
const GRID_STEPS = 4
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

export function FluxoCaixaTimeline(props: FluxoCaixaTimelineProps): ReactNode {
  const [hover, setHover] = useState<number | null>(null)

  const n = Math.max(1, props.points.length)
  const xAt = (i: number): number => (n === 1 ? (X0 + X1) / 2 : X0 + i * ((X1 - X0) / (n - 1)))
  // Rótulos do eixo X: mostra no máx. ~8 (1 a cada `labelStride`) + SEMPRE o último — evita sobreposição
  // quando há muitos meses. A linha/dots/hover seguem em TODOS os pontos; só o texto do eixo é raleado.
  const labelStride = Math.max(1, Math.ceil(n / 8))
  const showMonthLabel = (i: number): boolean => i % labelStride === 0 || i === n - 1

  // Chave estável do conteúdo (o memo depende dos valores, não da identidade do array).
  const seriesKey = props.points
    .map((p) => `${String(p.previstoCents)},${String(p.realizadoCents)},${String(p.saldoCents)}`)
    .join('|')

  const geom = useMemo(() => {
    const series: readonly { key: SeriesKey; values: readonly number[] }[] = [
      { key: 'previsto', values: props.points.map((p) => p.previstoCents / 100) },
      { key: 'realizado', values: props.points.map((p) => p.realizadoCents / 100) },
      { key: 'saldo', values: props.points.map((p) => p.saldoCents / 100) },
    ]
    const all = series.flatMap((s) => s.values)
    // A escala inclui o ZERO (Saldo pode negativar); headroom para as linhas não colarem nas bordas.
    const rawMax = Math.max(0, ...all)
    const rawMin = Math.min(0, ...all)
    const span = rawMax - rawMin || 1
    const yMax = rawMax + span * 0.08
    const yMin = rawMin - span * 0.08
    const range = yMax - yMin || 1
    const yAt = (v: number): number => Y0 + ((yMax - v) / range) * (Y1 - Y0)

    const gridlines = Array.from({ length: GRID_STEPS + 1 }, (_, tick) => {
      const v = yMax - (range * tick) / GRID_STEPS
      return { y: yAt(v), label: props.formatAxis(Math.round(v) * 100) }
    })
    const paths = series.map((s) => ({
      key: s.key,
      d: smoothPath(s.values.map((v, i): readonly [number, number] => [xAt(i), yAt(v)])),
      dots: s.values.map((v, i): readonly [number, number] => [xAt(i), yAt(v)]),
    }))
    const hasSignal = all.some((v) => v !== 0)
    return { gridlines, paths, zeroY: yAt(0), hasSignal, showZero: rawMin < 0 }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesKey])

  if (props.points.length === 0 || !geom.hasSignal) {
    return <p className={emptyState}>{props.emptyLabel}</p>
  }

  const drawLen = 2000
  const step = n === 1 ? X1 - X0 : (X1 - X0) / (n - 1)
  const hoverPoint = hover !== null ? props.points[hover] : undefined
  const hoverX = hover !== null ? xAt(hover) : 0
  const tip =
    hover !== null && hoverPoint !== undefined
      ? { left: Math.min(90, Math.max(10, (hoverX / VB_W) * 100)), top: 8 }
      : null

  const legendItems: readonly { key: SeriesKey; label: string }[] = [
    { key: 'previsto', label: props.labels.previsto },
    { key: 'realizado', label: props.labels.realizado },
    { key: 'saldo', label: props.labels.saldo },
  ]

  return (
    <div
      className={chartRel}
      onMouseLeave={() => {
        setHover(null)
      }}
    >
      <div className={legend}>
        {legendItems.map((it) => (
          <span key={it.key} className={legendItem}>
            <span className={`${legendSwatch} ${swatchTone[it.key]}`} aria-hidden />
            {it.label}
          </span>
        ))}
      </div>

      <svg
        className={lineSvg}
        viewBox={`0 0 ${String(VB_W)} ${String(VB_H)}`}
        role="img"
        aria-label={props.ariaLabel}
        preserveAspectRatio="none"
      >
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

        {/* Linha de base do zero (só quando há valores negativos). */}
        {geom.showZero && <line className={zeroLine} x1={X0} y1={geom.zeroY} x2={X1} y2={geom.zeroY} />}

        <g>
          {props.points.map((p, i) =>
            showMonthLabel(i) ? (
              <text key={p.key} className={monthText} x={xAt(i)} y={Y1 + 18} textAnchor="middle">
                {p.label}
              </text>
            ) : null,
          )}
        </g>

        {geom.paths.map((path) => (
          <path
            key={path.key}
            className={`${lineTone[path.key]} ${props.animate ? linePathAnimated : ''}`}
            d={path.d}
            strokeDasharray={drawLen}
            strokeDashoffset={props.animate ? 0 : drawLen}
          />
        ))}

        {/* Linha-guia vertical + dots no período sob o cursor. */}
        {hover !== null && hoverPoint !== undefined && (
          <g aria-hidden>
            <line className={hoverGuide} x1={hoverX} y1={Y0} x2={hoverX} y2={Y1} />
            {geom.paths.map((path) => {
              const dot = path.dots[hover]
              return dot ? (
                <circle key={path.key} className={dotTone[path.key]} cx={dot[0]} cy={dot[1]} r={4} />
              ) : null
            })}
          </g>
        )}

        {/* Zonas de hover invisíveis (uma por período). */}
        {props.points.map((p, i) => (
          <rect
            key={`hz-${p.key}`}
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

      {hover !== null && tip !== null && hoverPoint !== undefined && (
        <div
          className={tooltip}
          style={{ left: `${String(tip.left)}%`, top: `${String(tip.top)}%` }}
          role="status"
        >
          <div className={tooltipTitle}>{hoverPoint.label}</div>
          <div className={tooltipRow}>
            <span className={tooltipName}>
              <span className={`${tooltipSwatch} ${swatchTone.previsto}`} aria-hidden />{' '}
              {props.labels.previsto}
            </span>
            <span className={tooltipVal}>{props.formatValue(hoverPoint.previstoCents)}</span>
          </div>
          <div className={tooltipRow}>
            <span className={tooltipName}>
              <span className={`${tooltipSwatch} ${swatchTone.realizado}`} aria-hidden />{' '}
              {props.labels.realizado}
            </span>
            <span className={tooltipVal}>{props.formatValue(hoverPoint.realizadoCents)}</span>
          </div>
          <div className={tooltipRow}>
            <span className={tooltipName}>
              <span className={`${tooltipSwatch} ${swatchTone.saldo}`} aria-hidden /> {props.labels.saldo}
            </span>
            <span className={tooltipVal}>{props.formatValue(hoverPoint.saldoCents)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
