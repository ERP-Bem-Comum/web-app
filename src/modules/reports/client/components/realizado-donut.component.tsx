/**
 * RealizadoDonut — donut "Realizado vs previsto" (mock), SVG NATIVO (§VIII: sem lib). View BURRA: recebe as 3
 * fatias (label/valueCents/measureKey) + o rótulo central (execução %) + o formatador e apresenta os arcos
 * (um <circle> por fatia com stroke-dasharray, rotacionados -90°), o rótulo central e a legenda (ponto + nome
 * + valor). Cores por classe de token (.css.ts). Animação: os arcos "crescem" via stroke-dashoffset quando
 * `animate` vira true (SSR-safe: CSS transition).
 */
import type { ReactNode } from 'react'

import {
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
}>

const R = 45
const STROKE = 16
const CENTER = 60
const CIRC = 2 * Math.PI * R

export function RealizadoDonut(props: RealizadoDonutProps): ReactNode {
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

  return (
    <div className={donutWrap}>
      <div className={donut}>
        <svg
          className={donutSvg}
          viewBox="0 0 120 120"
          role="img"
          aria-label={props.slices.map((s) => s.label).join(', ')}
        >
          <g transform={`rotate(-90 ${String(CENTER)} ${String(CENTER)})`}>
            {arcs.map((a) => (
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
        {props.slices.map((s) => (
          <li key={s.id} className={legendItem}>
            <span className={`${legendDot} ${measureDot[s.measureKey]}`} aria-hidden="true" />
            <span className={legendName}>{s.label}</span>
            <span className={legendValue}>{props.formatValue(s.valueCents)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
