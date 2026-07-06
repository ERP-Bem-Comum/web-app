/**
 * EquipeVerticalBars — barras VERTICAIS "Distribuição por Raça/Cor" (componente NOVO, identidade "brand").
 * View BURRA: recebe as categorias já derivadas (label/count) + o máximo e desenha uma coluna por categoria,
 * com a CONTAGEM acima da barra, a barra preenchendo proporcional ao máximo, e o rótulo abaixo. Cor por
 * CLASSE (índice da categoria → token). Animação: a altura cresce quando `animate` vira true (CSS transition).
 *
 * Hover (padrão do Dashboard): passar o mouse por uma coluna mostra um TOOLTIP flutuante (card com sombra) com
 * swatch + nome + contagem + %. UI-state LOCAL (índice + posição do mouse) — só apresentação.
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
  vbars,
  vbarCol,
  vbarCount,
  vbarTrack,
  vbarFill,
  vbarLabel,
  racaFill,
  racaSwatch,
  emptyState,
} from './equipe-charts.css.ts'

export type VerticalBar = Readonly<{ id: string; label: string; count: number }>

export type EquipeVerticalBarsProps = Readonly<{
  bars: readonly VerticalBar[]
  /** Total (denominador da % no tooltip). */
  total: number
  emptyLabel: string
  animate: boolean
  formatPercent: (count: number, total: number) => string
}>

/** Chaves de cor 0..5 (ordem canônica de raça/cor) — casam com os styleVariants por índice do .css.ts. */
const COLOR_KEYS = ['0', '1', '2', '3', '4', '5'] as const
type RacaColorKey = (typeof COLOR_KEYS)[number]
const colorKey = (i: number): RacaColorKey => COLOR_KEYS[Math.max(0, Math.min(5, i))] ?? '5'

export function EquipeVerticalBars(props: EquipeVerticalBarsProps): ReactNode {
  const [hover, setHover] = useState<{ index: number; x: number; y: number } | null>(null)

  if (props.bars.length === 0) {
    return <p className={emptyState}>{props.emptyLabel}</p>
  }

  const maxCount = Math.max(1, ...props.bars.map((b) => b.count))
  const active = hover !== null ? props.bars[hover.index] : undefined

  return (
    <div
      className={chartRel}
      onMouseLeave={() => {
        setHover(null)
      }}
    >
      <div className={vbars}>
        {props.bars.map((b, i) => {
          // Altura = contagem / máximo (0 quando não animado). Clamp defensivo.
          const heightPct = props.animate ? Math.max(0, Math.min(100, (b.count / maxCount) * 100)) : 0
          return (
            <div
              key={b.id}
              className={vbarCol}
              onMouseMove={(e) => {
                const rect = e.currentTarget.parentElement?.parentElement?.getBoundingClientRect()
                if (!rect) return
                setHover({ index: i, x: e.clientX - rect.left, y: e.clientY - rect.top })
              }}
            >
              <span className={vbarCount}>{b.count}</span>
              <span className={vbarTrack}>
                <span
                  className={`${vbarFill} ${racaFill[colorKey(i)]}`}
                  style={{ blockSize: `${String(heightPct)}%` }}
                />
              </span>
              <span className={vbarLabel} title={b.label}>
                {b.label}
              </span>
            </div>
          )
        })}
      </div>

      {hover !== null && active !== undefined && (
        <div
          className={tooltip}
          style={{ left: `${String(hover.x)}px`, top: `${String(hover.y)}px` }}
          role="status"
        >
          <div className={tooltipTitle}>
            <span className={`${tooltipSwatch} ${racaSwatch[colorKey(hover.index)]}`} aria-hidden />
            {active.label}
          </div>
          <div className={tooltipRow}>
            <span className={tooltipName}>{active.count}</span>
            <span className={tooltipVal}>{props.formatPercent(active.count, props.total)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
