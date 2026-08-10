/**
 * DonutChart — view BURRA (§XI) em SVG NATIVO (§VIII: sem lib nova). Parametrizável: recebe as fatias
 * (label/valor/accent) por props. Fatias vazias → mensagem de estado vazio (i18n via `emptyLabel`). As
 * cores das fatias vêm de CLASSES de token mapeadas do `accent` semântico (§boundaries: client-ui ↛
 * ds-tokens). Cada arco é um <circle> com stroke-dasharray (donut sem path complexo), pronto p/ dados reais.
 */
import { useRef, useState, type ReactNode } from 'react'

import type { DonutSlice } from '../dashboard-summary.view-model.ts'
import {
  wrap,
  svgEl,
  empty,
  legend,
  legendItem,
  legendSwatch,
  legendLabel,
  legendValue,
  arcStroke,
  arcHover,
  swatchColor,
  tooltip,
  tooltipTitle,
  tooltipRow,
  tooltipVal,
  tooltipPct,
} from './donut-chart.css.ts'

/** % da fatia (fração do total) formatada pt-BR com 1 casa (ex.: "37,5%"). Presentação pura. */
const pctLabel = (value: number, total: number): string =>
  `${((value / total) * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`

/** Valor (centavos) em BRL para o tooltip (ex.: "R$ 45.000,00"). Presentação pura. */
const brlLabel = (cents: number): string =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

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

  // UI-state LOCAL do hover: índice da fatia + posição do cursor (relativa ao `wrap`) p/ o tooltip.
  const wrapRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<{ index: number; x: number; y: number } | null>(null)
  const onMove =
    (index: number) =>
    (e: { clientX: number; clientY: number }): void => {
      const rect = wrapRef.current?.getBoundingClientRect()
      if (!rect) return
      setHover({ index, x: e.clientX - rect.left, y: e.clientY - rect.top })
    }
  const active = hover !== null ? slices[hover.index] : undefined

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
      tone: DonutSlice['tone']
      dash: number
      gap: number
      offset: number
    }>[]
  >((acc, s) => {
    const consumed = acc.reduce((sum, a) => sum + a.dash, 0)
    const dash = (s.value / total) * CIRCUMFERENCE
    return [...acc, { id: s.id, tone: s.tone, dash, gap: CIRCUMFERENCE - dash, offset: -consumed }]
  }, [])

  return (
    <div
      ref={wrapRef}
      className={wrap}
      onMouseLeave={() => {
        setHover(null)
      }}
    >
      <svg
        className={svgEl}
        viewBox={`0 0 ${String(SIZE)} ${String(SIZE)}`}
        role="img"
        aria-label={slices.map(props.sliceLabel).join(', ')}
      >
        <g transform={`rotate(-90 ${String(CENTER)} ${String(CENTER)})`}>
          {arcs.map((a, i) => (
            <circle
              key={a.id}
              className={`${arcStroke[a.tone]} ${arcHover}`}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE}
              strokeDasharray={`${String(a.dash)} ${String(a.gap)}`}
              strokeDashoffset={a.offset}
              onMouseMove={onMove(i)}
            />
          ))}
        </g>
      </svg>
      <ul className={legend}>
        {slices.map((s, i) => (
          <li key={s.id} className={legendItem} onMouseMove={onMove(i)}>
            <span className={`${legendSwatch} ${swatchColor[s.tone]}`} aria-hidden />
            <span className={legendLabel}>{props.sliceLabel(s)}</span>
            <span className={legendValue}>{pctLabel(s.value, total)}</span>
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
            <span className={`${legendSwatch} ${swatchColor[active.tone]}`} aria-hidden />
            {props.sliceLabel(active)}
          </div>
          <div className={tooltipRow}>
            <span className={tooltipVal}>{brlLabel(active.value)}</span>
            <span className={tooltipPct}>{pctLabel(active.value, total)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
