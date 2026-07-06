/**
 * SupplierComplianceBars — barras horizontais "Utilização do limite por fornecedor" (relatório
 * "Fornecedores sem Contrato"). View BURRA: recebe as barras JÁ derivadas (nome + status + textos formatados
 * + a % bruta para a largura) pela page/ViewModel e apresenta uma barra por fornecedor no padrão do
 * "Realizado × Planejado": nome (à direita, ellipsis) + track (com marcador de 100% do Limite) + fill
 * colorido POR STATUS + % ao lado. A largura do fill é `min(100, utilizadoPct)` — estouros batem/travam em
 * 100% e a cor DANGER sinaliza o "acima". Cores por classe de token (.css.ts). Animação: a largura cresce
 * quando `animate` vira true (SSR-safe: CSS transition).
 *
 * Hover (padrão do Dashboard): em vez do `title` nativo, um TOOLTIP HTML flutuante (card com sombra) mostra
 * swatch por status + nome + valor R$ + % utilizado, posicionado sob o cursor. UI-state LOCAL (índice +
 * posição do mouse) — só apresentação; a page/ViewModel seguem puras.
 */
import { useState, type ReactNode } from 'react'

import {
  chartRel,
  tooltip,
  tooltipTitle,
  tooltipSwatch,
  tooltipSwatchStatus,
  tooltipRow,
  tooltipName,
  tooltipVal,
  hbar,
  hbarName,
  hbarTrack,
  limitMarker,
  hbarFill,
  hbarFillAnimated,
  fillStatus,
  hbarValue,
  valueStatus,
  emptyState,
} from './supplier-compliance-bars.css.ts'

/** Status de compliance de um fornecedor (dirige a cor do fill/valor). */
export type ComplianceStatus = 'over' | 'at' | 'within'

/** Barra já derivada pela page (a view não calcula nada). */
export type ComplianceBar = Readonly<{
  /** Chave estável (o nome do fornecedor). */
  id: string
  /** Nome exibido (à direita, ellipsis). */
  name: string
  /** % utilizado BRUTA (pode passar de 100) — só para a largura; o texto vem pronto em `valueLabel`. */
  utilizadoPct: number
  /** Status de compliance (cor). */
  status: ComplianceStatus
  /** Texto à direita = SÓ a % (ex.: "129,82%"). */
  valueLabel: string
  /** Valor em R$ exibido no HOVER da barra (tooltip). */
  valueTitle: string
}>

export type SupplierComplianceBarsProps = Readonly<{
  bars: readonly ComplianceBar[]
  emptyLabel: string
  animate: boolean
}>

export function SupplierComplianceBars(props: SupplierComplianceBarsProps): ReactNode {
  // UI-state LOCAL do hover (índice da barra sob o cursor + posição relativa do mouse p/ o tooltip).
  const [hover, setHover] = useState<{ index: number; x: number; y: number } | null>(null)

  if (props.bars.length === 0) {
    return <p className={emptyState}>{props.emptyLabel}</p>
  }

  // Escala do track = o maior % (mín. 100). O fill é PROPORCIONAL ao % REAL (129% fica maior que 100% e
  // ultrapassa o marcador do Limite); a cor danger reforça o "acima". Marcador do Limite (100%) na posição
  // proporcional (100 ÷ escala). Se ninguém estoura, escala=100 → marcador no fim do track.
  const maxPct = props.bars.reduce((m, b) => Math.max(m, b.utilizadoPct), 0)
  const scaleMax = Math.max(100, maxPct)
  const markerPct = (100 / scaleMax) * 100

  const active = hover !== null ? props.bars[hover.index] : undefined

  return (
    <div
      className={chartRel}
      onMouseLeave={() => {
        setHover(null)
      }}
    >
      {props.bars.map((b, i) => {
        const widthPct = props.animate ? (b.utilizadoPct / scaleMax) * 100 : 0
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
            <span className={hbarName} title={b.name}>
              {b.name}
            </span>
            <span className={hbarTrack}>
              <span
                className={`${hbarFill} ${fillStatus[b.status]} ${props.animate ? hbarFillAnimated : ''}`}
                style={{ inlineSize: `${String(widthPct)}%` }}
              />
              <span
                className={limitMarker}
                style={{ insetInlineStart: `${String(markerPct)}%` }}
                aria-hidden="true"
              />
            </span>
            <span className={`${hbarValue} ${valueStatus[b.status]}`}>{b.valueLabel}</span>
          </div>
        )
      })}

      {hover !== null && active !== undefined && (
        <div
          className={tooltip}
          style={{ left: `${String(hover.x)}px`, top: `${String(hover.y)}px` }}
          role="status"
        >
          <div className={tooltipTitle}>
            <span className={`${tooltipSwatch} ${tooltipSwatchStatus[active.status]}`} aria-hidden />
            {active.name}
          </div>
          <div className={tooltipRow}>
            <span className={tooltipName}>{active.valueTitle}</span>
            <span className={tooltipVal}>{active.valueLabel}</span>
          </div>
        </div>
      )}
    </div>
  )
}
