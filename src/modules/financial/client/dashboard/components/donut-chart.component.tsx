/**
 * DonutChart — view BURRA (§XI) em SVG NATIVO (§VIII: sem lib nova). Parametrizável: recebe as fatias
 * (label/valor/accent) por props. Fatias vazias → mensagem de estado vazio (i18n via `emptyLabel`). As
 * cores das fatias vêm de CLASSES de token mapeadas do `accent` semântico (§boundaries: client-ui ↛
 * ds-tokens). Cada arco é um <circle> com stroke-dasharray (donut sem path complexo), pronto p/ dados reais.
 */
import type { ReactNode } from 'react'

import type { DonutSlice } from '../dashboard-summary.view-model.ts'
import {
  wrap,
  svgEl,
  empty,
  legend,
  legendItem,
  legendSwatch,
  legendLabel,
  arcStroke,
  swatchColor,
} from './donut-chart.css.ts'

// Geometria do donut (unidades abstratas do viewBox).
const SIZE = 160
const RADIUS = 60
const STROKE = 24
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const CENTER = SIZE / 2

export type DonutChartProps = Readonly<{
  slices: readonly DonutSlice[]
  emptyLabel: string
  /** rótulo da fatia (i18n) */
  sliceLabel: (slice: DonutSlice) => string
}>

export function DonutChart(props: DonutChartProps): ReactNode {
  const { slices } = props
  const total = slices.reduce((sum, s) => sum + s.value, 0)

  if (slices.length === 0 || total <= 0) {
    return (
      <div className={wrap}>
        <p className={empty}>{props.emptyLabel}</p>
      </div>
    )
  }

  // Pré-computa cada arco (fração, dash/gap, offset acumulado) SEM mutação após o render.
  const arcs = slices.reduce<
    readonly Readonly<{
      id: string
      accent: DonutSlice['accent']
      dash: number
      gap: number
      offset: number
    }>[]
  >((acc, s) => {
    const consumed = acc.reduce((sum, a) => sum + a.dash, 0)
    const dash = (s.value / total) * CIRCUMFERENCE
    return [...acc, { id: s.id, accent: s.accent, dash, gap: CIRCUMFERENCE - dash, offset: -consumed }]
  }, [])

  return (
    <div className={wrap}>
      <svg
        className={svgEl}
        viewBox={`0 0 ${String(SIZE)} ${String(SIZE)}`}
        role="img"
        aria-label={slices.map(props.sliceLabel).join(', ')}
      >
        <g transform={`rotate(-90 ${String(CENTER)} ${String(CENTER)})`}>
          {arcs.map((a) => (
            <circle
              key={a.id}
              className={arcStroke[a.accent]}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE}
              strokeDasharray={`${String(a.dash)} ${String(a.gap)}`}
              strokeDashoffset={a.offset}
            />
          ))}
        </g>
      </svg>
      <ul className={legend}>
        {slices.map((s) => (
          <li key={s.id} className={legendItem}>
            <span className={`${legendSwatch} ${swatchColor[s.accent]}`} aria-hidden />
            <span className={legendLabel}>{props.sliceLabel(s)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
