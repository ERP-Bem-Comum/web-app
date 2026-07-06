/**
 * RealizadoDonut — donut "Realizado vs previsto" (mock), SVG NATIVO (§VIII: sem lib). View BURRA: recebe as 3
 * fatias (label/valueCents/measureKey) + o rótulo central (execução %) + o formatador e apresenta os arcos
 * (um <circle> por fatia com stroke-dasharray, rotacionados -90°), o rótulo central e a legenda (ponto + nome
 * + valor). Cores por classe de token (.css.ts). Animação: os arcos "crescem" via stroke-dashoffset quando
 * `animate` vira true (SSR-safe: CSS transition).
 *
 * Hover (padrão do Dashboard): passar o mouse por um arco OU por uma linha da legenda mostra um TOOLTIP HTML
 * flutuante (card com sombra) com swatch + nome da fatia + valor R$ + % do total, posicionado sob o cursor.
 * UI-state LOCAL (índice da fatia) — só apresentação; a ViewModel é pura.
 */
import { useState, type ReactNode } from 'react'

import {
  chartRel,
  tooltip,
  tooltipTitle,
  tooltipSwatch,
  tooltipSwatchColor,
  tooltipRow,
  tooltipName,
  tooltipVal,
  donutWrap,
  donut,
  donutSvg,
  donutCenter,
  donutBig,
  donutCap,
  arcAnimated,
  measureStroke,
  measureDot,
  legend,
  legendItem,
  legendDot,
  legendName,
  legendValue,
  emptyState,
} from './realizado-charts.css.ts'

/** Chave de cor da medida (mapeada a token no .css.ts). */
export type MeasureKey = 'realizado' | 'provisionado' | 'previsto'

export type DonutSlice = Readonly<{
  id: string
  label: string
  valueCents: number
  measureKey: MeasureKey
}>

export type RealizadoDonutProps = Readonly<{
  slices: readonly DonutSlice[]
  /** Rótulo central (ex.: "24%"). */
  centerValue: string
  /** Legenda do rótulo central (ex.: "execução"). */
  centerCaption: string
  emptyLabel: string
  animate: boolean
  formatValue: (cents: number) => string
  /** Formata a % do total (0–100) p/ o tooltip, ex.: "24,1%". */
  formatPercent: (pct: number) => string
}>

const R = 45
const STROKE = 16
const CENTER = 60
const CIRC = 2 * Math.PI * R

export function RealizadoDonut(props: RealizadoDonutProps): ReactNode {
  // UI-state LOCAL do hover (índice da fatia + posição relativa do mouse p/ o tooltip). Só apresentação.
  const [hover, setHover] = useState<{ index: number; x: number; y: number } | null>(null)

  const total = props.slices.reduce((s, x) => s + x.valueCents, 0)

  if (props.slices.length === 0 || total <= 0) {
    return <p className={emptyState}>{props.emptyLabel}</p>
  }

  const arcs = props.slices.reduce<
    readonly Readonly<{ id: string; measureKey: MeasureKey; dash: number; gap: number; offset: number }>[]
  >((acc, s) => {
    const consumed = acc.reduce((sum, a) => sum + a.dash, 0)
    const dash = (s.valueCents / total) * CIRC
    return [...acc, { id: s.id, measureKey: s.measureKey, dash, gap: CIRC - dash, offset: -consumed }]
  }, [])

  const active = hover !== null ? props.slices[hover.index] : undefined
  const track = (index: number) => (e: { clientX: number; clientY: number; currentTarget: Element }) => {
    const host = e.currentTarget.closest(`.${chartRel}`)
    const rect = host?.getBoundingClientRect()
    if (!rect) return
    setHover({ index, x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  return (
    <div
      className={`${donutWrap} ${chartRel}`}
      onMouseLeave={() => {
        setHover(null)
      }}
    >
      <div className={donut}>
        <svg
          className={donutSvg}
          viewBox="0 0 120 120"
          role="img"
          aria-label={props.slices.map((s) => s.label).join(', ')}
        >
          <g transform={`rotate(-90 ${String(CENTER)} ${String(CENTER)})`}>
            {arcs.map((a, i) => (
              <circle
                key={a.id}
                className={`${measureStroke[a.measureKey]} ${props.animate ? arcAnimated : ''}`}
                cx={CENTER}
                cy={CENTER}
                r={R}
                fill="none"
                strokeWidth={STROKE}
                strokeDasharray={`${String(a.dash)} ${String(a.gap)}`}
                strokeDashoffset={props.animate ? a.offset : a.offset - CIRC}
                onMouseMove={track(i)}
              />
            ))}
          </g>
        </svg>
        <div className={donutCenter}>
          <span className={donutBig}>{props.centerValue}</span>
          <span className={donutCap}>{props.centerCaption}</span>
        </div>
      </div>

      <ul className={legend}>
        {props.slices.map((s, i) => (
          <li key={s.id} className={legendItem} onMouseMove={track(i)}>
            <span className={`${legendDot} ${measureDot[s.measureKey]}`} aria-hidden="true" />
            <span className={legendName}>{s.label}</span>
            <span className={legendValue}>{props.formatValue(s.valueCents)}</span>
          </li>
        ))}
      </ul>

      {hover !== null && active !== undefined && (
        <div
          className={tooltip}
          style={{ left: `${String(hover.x)}px`, top: `${String(hover.y)}px` }}
          role="status"
        >
          <div className={tooltipTitle}>
            <span className={`${tooltipSwatch} ${tooltipSwatchColor[active.measureKey]}`} aria-hidden />
            {active.label}
          </div>
          <div className={tooltipRow}>
            <span className={tooltipName}>{props.formatValue(active.valueCents)}</span>
            <span className={tooltipVal}>{props.formatPercent((active.valueCents / total) * 100)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
