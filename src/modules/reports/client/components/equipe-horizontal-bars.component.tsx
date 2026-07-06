/**
 * EquipeHorizontalBars — barras horizontais "Distribuição por Idade" e "Distribuição por Função" (identidade
 * EXATA das barras "Por centro de custo" do Realizado × Planejado). View BURRA: recebe as categorias já
 * derivadas (label/count) + o máximo e desenha, por linha: nome à esquerda, barra proporcional ao MÁXIMO (não
 * ao total — leitura comparativa), e a CONTAGEM à direita. Cor única da marca. Animação: a largura cresce
 * quando `animate` vira true (CSS transition).
 *
 * Hover (padrão do Dashboard): TOOLTIP flutuante (card com sombra) com nome + contagem + % do total. UI-state
 * LOCAL (índice + posição do mouse) — só apresentação.
 */
import { useState, type ReactNode } from 'react'

import {
  chartRel,
  tooltip,
  tooltipTitle,
  tooltipRow,
  tooltipName,
  tooltipVal,
  hbar,
  hbarName,
  hbarTrack,
  hbarFillEquipe,
  hbarFillEquipeTone,
  hbarFillAnimatedEquipe,
  hbarCount,
  emptyState,
} from './equipe-charts.css.ts'

export type HorizontalBar = Readonly<{ id: string; label: string; count: number }>

/** Cor do fill: `primary` (azul da marca) ou `alt` (verde-azulado) — distingue os 2 gráficos de barras. */
export type HorizontalBarsTone = 'primary' | 'alt'

export type EquipeHorizontalBarsProps = Readonly<{
  bars: readonly HorizontalBar[]
  /** Total (denominador da % no tooltip). */
  total: number
  emptyLabel: string
  animate: boolean
  formatPercent: (count: number, total: number) => string
  /** Cor das barras (default `primary`). */
  tone?: HorizontalBarsTone
}>

export function EquipeHorizontalBars(props: EquipeHorizontalBarsProps): ReactNode {
  const [hover, setHover] = useState<{ index: number; x: number; y: number } | null>(null)

  if (props.bars.length === 0) {
    return <p className={emptyState}>{props.emptyLabel}</p>
  }

  const maxCount = Math.max(1, ...props.bars.map((b) => b.count))
  const active = hover !== null ? props.bars[hover.index] : undefined
  const toneClass = hbarFillEquipeTone[props.tone ?? 'primary']

  return (
    <div
      className={chartRel}
      onMouseLeave={() => {
        setHover(null)
      }}
    >
      {props.bars.map((b, i) => {
        // Largura = contagem / máximo (0 quando não animado). Clamp defensivo.
        const widthPct = props.animate ? Math.max(0, Math.min(100, (b.count / maxCount) * 100)) : 0
        return (
          <div
            key={b.id}
            className={hbar}
            onMouseMove={(e) => {
              const rect = e.currentTarget.parentElement?.getBoundingClientRect()
              if (!rect) return
              setHover({ index: i, x: e.clientX - rect.left, y: e.clientY - rect.top })
            }}
          >
            <span className={hbarName} title={b.label}>
              {b.label}
            </span>
            <span className={hbarTrack}>
              <span
                className={`${hbarFillEquipe} ${toneClass} ${props.animate ? hbarFillAnimatedEquipe : ''}`}
                style={{ inlineSize: `${String(widthPct)}%` }}
              />
            </span>
            <span className={hbarCount}>{b.count}</span>
          </div>
        )
      })}

      {hover !== null && active !== undefined && (
        <div
          className={tooltip}
          style={{ left: `${String(hover.x)}px`, top: `${String(hover.y)}px` }}
          role="status"
        >
          <div className={tooltipTitle}>{active.label}</div>
          <div className={tooltipRow}>
            <span className={tooltipName}>{active.count}</span>
            <span className={tooltipVal}>{props.formatPercent(active.count, props.total)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
