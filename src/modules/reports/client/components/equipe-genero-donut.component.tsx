/**
 * EquipeGeneroDonut — donut "Distribuição por Gênero" (identidade EXATA do donut do Realizado × Planejado),
 * SVG NATIVO (§VIII: sem lib). View BURRA: recebe as fatias já derivadas (label/count) + o total e apresenta os
 * arcos (um <circle> por fatia, rotacionados -90°), o rótulo central (total de colaboradores), a legenda
 * (ponto + nome + contagem) e o TOOLTIP flutuante (hover) com swatch + nome + contagem + %. Cores por CLASSE
 * (índice da fatia → token). UI-state LOCAL (índice da fatia + posição do mouse) — só apresentação.
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
  donutWrap,
  donut,
  donutSvg,
  donutCenter,
  donutBig,
  donutCap,
  arcAnimated,
  generoStroke,
  generoDot,
  generoSwatch,
  legend,
  legendItem,
  legendDot,
  legendName,
  legendValue,
  emptyState,
} from './equipe-charts.css.ts'

export type DonutSliceCount = Readonly<{ id: string; label: string; count: number }>

export type EquipeGeneroDonutProps = Readonly<{
  slices: readonly DonutSliceCount[]
  /** Rótulo central (total de colaboradores). */
  centerValue: string
  /** Legenda do rótulo central (ex.: "colaboradores"). */
  centerCaption: string
  emptyLabel: string
  animate: boolean
  /** Formata a % da fatia sobre o total (ex.: "38,9%"). */
  formatPercent: (count: number, total: number) => string
}>

const R = 45
const STROKE = 16
const CENTER = 60
const CIRC = 2 * Math.PI * R

/** Chave de cor (índice da fatia como string) — casa com os styleVariants por índice do .css.ts. */
const colorKey = (i: number): '0' | '1' | '2' => (i === 0 ? '0' : i === 1 ? '1' : '2')

export function EquipeGeneroDonut(props: EquipeGeneroDonutProps): ReactNode {
  const [hover, setHover] = useState<{ index: number; x: number; y: number } | null>(null)

  const total = props.slices.reduce((s, x) => s + x.count, 0)

  if (props.slices.length === 0 || total <= 0) {
    return <p className={emptyState}>{props.emptyLabel}</p>
  }

  const arcs = props.slices.reduce<
    readonly Readonly<{ id: string; index: number; dash: number; gap: number; offset: number }>[]
  >((acc, s, i) => {
    const consumed = acc.reduce((sum, a) => sum + a.dash, 0)
    const dash = (s.count / total) * CIRC
    return [...acc, { id: s.id, index: i, dash, gap: CIRC - dash, offset: -consumed }]
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
          aria-label={props.slices.map((s) => `${s.label}: ${String(s.count)}`).join(', ')}
        >
          <g transform={`rotate(-90 ${String(CENTER)} ${String(CENTER)})`}>
            {arcs.map((a) => (
              <circle
                key={a.id}
                className={`${generoStroke[colorKey(a.index)]} ${props.animate ? arcAnimated : ''}`}
                cx={CENTER}
                cy={CENTER}
                r={R}
                fill="none"
                strokeWidth={STROKE}
                strokeDasharray={`${String(a.dash)} ${String(a.gap)}`}
                strokeDashoffset={props.animate ? a.offset : a.offset - CIRC}
                onMouseMove={track(a.index)}
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
            <span className={`${legendDot} ${generoDot[colorKey(i)]}`} aria-hidden="true" />
            <span className={legendName}>{s.label}</span>
            <span className={legendValue}>{s.count}</span>
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
            <span className={`${tooltipSwatch} ${generoSwatch[colorKey(hover.index)]}`} aria-hidden />
            {active.label}
          </div>
          <div className={tooltipRow}>
            <span className={tooltipName}>{active.count}</span>
            <span className={tooltipVal}>{props.formatPercent(active.count, total)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
