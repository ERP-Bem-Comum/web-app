/**
 * RealizadoCostCenterBars — barras horizontais "Por centro de custo" (mock). View BURRA: recebe as fatias já
 * derivadas (top-N por Planejado, com a % de PARTICIPAÇÃO no orçamento e o flag de concentração). A barra
 * enche PROPORCIONAL à % de participação (`sharePct`, relativa ao total = 100%); centros de maior peso
 * (`high`) ganham DESTAQUE de cor (âmbar de atenção), os demais ficam azuis. Cores por classe (.css.ts).
 * Animação: a largura cresce quando `animate` vira true (SSR-safe: CSS transition).
 *
 * Hover (padrão do Dashboard): em vez do `title` nativo, um TOOLTIP HTML flutuante (card com sombra) mostra
 * nome + valor R$ + % de participação, posicionado sob o cursor. UI-state LOCAL (índice + posição do mouse) —
 * só apresentação; a page/ViewModel seguem puras.
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
  hbarFill,
  hbarFillAnimated,
  hbarFillConcentration,
  hbarFillRec,
  hbarValue,
  hbarValueConcentration,
  emptyState,
} from './realizado-charts.css.ts'

export type CostCenterBar = Readonly<{
  id: string
  label: string
  /** % de participação no total planejado (0–100) — dirige a LARGURA do fill. */
  sharePct: number
  /** Concentração alta (participação ≥ limiar) → destaque de cor (âmbar). */
  high: boolean
  /** Texto à direita = SÓ a % (ex.: "41,2%"). */
  percentLabel: string
  /** Valor em R$ exibido no HOVER da barra (tooltip). */
  valueTitle: string
}>

export type RealizadoCostCenterBarsProps = Readonly<{
  bars: readonly CostCenterBar[]
  emptyLabel: string
  animate: boolean
  /** Cor do fill: sem prop = padrão (azul/âmbar por concentração); `'rec'` = roxo da Posição de Recebimentos. */
  fillTone?: 'rec'
}>

export function RealizadoCostCenterBars(props: RealizadoCostCenterBarsProps): ReactNode {
  // UI-state LOCAL do hover (índice da barra sob o cursor + posição relativa do mouse p/ o tooltip).
  const [hover, setHover] = useState<{ index: number; x: number; y: number } | null>(null)

  if (props.bars.length === 0) {
    return <p className={emptyState}>{props.emptyLabel}</p>
  }

  const active = hover !== null ? props.bars[hover.index] : undefined

  return (
    <div
      className={chartRel}
      onMouseLeave={() => {
        setHover(null)
      }}
    >
      {props.bars.map((b, i) => {
        const tone = b.high ? 'high' : 'normal'
        // Recebimentos usa o roxo próprio; senão, a cor por concentração (azul/âmbar).
        const fillClass = props.fillTone === 'rec' ? hbarFillRec : hbarFillConcentration[tone]
        // Largura = % de participação (relativa ao total = 100%); clamp defensivo.
        const widthPct = props.animate ? Math.max(0, Math.min(100, b.sharePct)) : 0
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
                className={`${hbarFill} ${fillClass} ${props.animate ? hbarFillAnimated : ''}`}
                style={{ inlineSize: `${String(widthPct)}%` }}
              />
            </span>
            <span className={`${hbarValue} ${hbarValueConcentration[tone]}`}>{b.percentLabel}</span>
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
            <span className={tooltipName}>{active.valueTitle}</span>
            <span className={tooltipVal}>{active.percentLabel}</span>
          </div>
        </div>
      )}
    </div>
  )
}
