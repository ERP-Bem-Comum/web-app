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
  donutLg,
  pieLabel,
  donutSvg,
  arcAnimated,
  generoStroke,
  generoSwatch,
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

/**
 * Geometria da PIZZA (paridade com o legado, P.O. 2026-07-20). O desenho continua sendo um `<circle>` com
 * `stroke-dasharray` — o truque para fechar o furo do donut é fazer o traço ir do centro à borda:
 * a coroa vai de `R - STROKE/2` a `R + STROKE/2`, então `R = 30` e `STROKE = 60` cobrem de 0 a 60.
 * Sem `path`/arco manual: mesma técnica, mesma acessibilidade, zero matemática de bezier.
 */
const R = 30
const STROKE = 60
const CENTER = 60
const CIRC = 2 * Math.PI * R

/** Raio onde o rótulo da fatia é escrito (dentro da pizza, entre o centro e a borda). */
const LABEL_R = 34

/**
 * Fatia pequena não recebe rótulo escrito: abaixo disso o texto sai maior que a fatia e vira sujeira por
 * cima das vizinhas (no legado o rótulo de uma fatia de 1 pessoa vazava para fora do gráfico). Quem ficar
 * sem rótulo continua identificável pelo tooltip.
 */
const MIN_SHARE_FOR_LABEL = 0.08

/** Chave de cor (índice da fatia como string) — casa com os styleVariants por índice do .css.ts. */
/**
 * Cor pela CHAVE CANÔNICA da categoria (`MULHER_CIS`, `NA`…), não pelo índice. O índice quebrou quando o
 * backend passou a mandar 9 categorias em outra ordem — cada cor ia parar na categoria errada.
 */
const colorKey = (id: string): string => id

export function EquipeGeneroDonut(props: EquipeGeneroDonutProps): ReactNode {
  const [hover, setHover] = useState<{ index: number; x: number; y: number } | null>(null)

  const total = props.slices.reduce((s, x) => s + x.count, 0)

  if (props.slices.length === 0 || total <= 0) {
    return <p className={emptyState}>{props.emptyLabel}</p>
  }

  const arcs = props.slices.reduce<
    readonly Readonly<{
      id: string
      index: number
      dash: number
      gap: number
      offset: number
      share: number
      labelX: number
      labelY: number
    }>[]
  >((acc, s, i) => {
    const consumed = acc.reduce((sum, a) => sum + a.dash, 0)
    const share = s.count / total
    const dash = share * CIRC
    // Ângulo do MEIO da fatia, a partir do topo e no sentido horário (o `<g>` já rotaciona -90°).
    const midTurn = consumed / CIRC + share / 2
    const angle = midTurn * 2 * Math.PI
    return [
      ...acc,
      {
        id: s.id,
        index: i,
        dash,
        gap: CIRC - dash,
        offset: -consumed,
        share,
        labelX: CENTER + LABEL_R * Math.sin(angle),
        labelY: CENTER - LABEL_R * Math.cos(angle),
      },
    ]
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
      <div className={`${donut} ${donutLg}`}>
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
                className={`${generoStroke[colorKey(a.id)] ?? ''} ${props.animate ? arcAnimated : ''}`}
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
          {/* Rótulo DENTRO da fatia (legado). Fora do `<g>` rotacionado: o texto fica na horizontal,
              legível, enquanto as coordenadas já vêm calculadas no ângulo certo. */}
          {arcs.map((a) =>
            a.share < MIN_SHARE_FOR_LABEL ? null : (
              <text
                key={`lbl-${a.id}`}
                className={pieLabel}
                x={a.labelX}
                y={a.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                aria-hidden="true"
              >
                {props.slices[a.index]?.label ?? ''}
              </text>
            ),
          )}
        </svg>
      </div>

      {hover !== null && active !== undefined && (
        <div
          className={tooltip}
          style={{ left: `${String(hover.x)}px`, top: `${String(hover.y)}px` }}
          role="status"
        >
          <div className={tooltipTitle}>
            <span className={`${tooltipSwatch} ${generoSwatch[colorKey(active.id)] ?? ''}`} aria-hidden />
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
