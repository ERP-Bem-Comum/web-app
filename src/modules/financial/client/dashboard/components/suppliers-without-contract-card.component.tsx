/**
 * SuppliersWithoutContractCard — view BURRA (§XI): card branco com título, GRÁFICO de barras de compliance
 * (espelha o relatório "Fornecedores sem Contrato": nome + track com marcador de Limite + fill colorido POR
 * STATUS + % ao lado) e botão "Ver todas" de largura total. Recebe as barras JÁ derivadas (nome + status + %
 * bruta p/ a largura + textos formatados) pela page/ViewModel — a view não calcula nada. Layout COMPACTO p/ o
 * card estreito. `onSeeAll` opcional (navegação futura). i18n via as labels recebidas (nada hardcoded).
 *
 * Hover (padrão do Dashboard): em vez do `title` nativo, um TOOLTIP HTML flutuante (card com sombra) mostra
 * swatch por status + nome + valor R$ + % utilizado, sob o cursor. UI-state LOCAL (índice + posição do mouse)
 * — só apresentação; a page/ViewModel seguem puras. Fill PROPORCIONAL ao % REAL (escala do track = maior %),
 * então estouros passam do marcador do Limite; a cor danger reforça o "acima".
 */
import { useState, type ReactNode } from 'react'

import {
  card,
  title,
  chartRel,
  hbar,
  hbarName,
  hbarTrack,
  limitMarker,
  hbarFill,
  hbarFillAnimated,
  fillStatus,
  hbarValue,
  valueStatus,
  tooltip,
  tooltipTitle,
  tooltipSwatch,
  tooltipSwatchStatus,
  tooltipRow,
  tooltipName,
  tooltipVal,
  emptyState,
  seeAllButton,
} from './suppliers-without-contract-card.css.ts'

/** Status de compliance de um fornecedor (dirige a cor do fill/%). */
export type SupplierBarStatus = 'over' | 'at' | 'within'

/** Barra já derivada pela page (a view não calcula nada). */
export type SupplierBar = Readonly<{
  /** Chave estável. */
  id: string
  /** Nome exibido (esquerda, ellipsis). */
  name: string
  /** % utilizado BRUTA (pode passar de 100) — só p/ a largura; o texto vem pronto em `percentLabel`. */
  utilizadoPct: number
  /** Status de compliance (cor). */
  status: SupplierBarStatus
  /** Texto à direita = SÓ a % (ex.: "129,82%"). */
  percentLabel: string
  /** Valor em R$ exibido no HOVER (tooltip). */
  valueLabel: string
}>

export type SuppliersWithoutContractCardProps = Readonly<{
  title: string
  seeAllLabel: string
  emptyLabel: string
  bars: readonly SupplierBar[]
  /** Anima a entrada das barras (largura cresce quando true). SSR-safe (CSS transition). */
  animate: boolean
  onSeeAll?: () => void
}>

export function SuppliersWithoutContractCard(props: SuppliersWithoutContractCardProps): ReactNode {
  // UI-state LOCAL do hover (índice da barra sob o cursor + posição relativa do mouse p/ o tooltip).
  const [hover, setHover] = useState<{ index: number; x: number; y: number } | null>(null)

  // Escala do track = o maior % (mín. 100). O fill é PROPORCIONAL ao % REAL (129% ultrapassa o marcador do
  // Limite). Marcador do Limite (100%) na posição proporcional (100 ÷ escala). Sem estouro → marcador no fim.
  const maxPct = props.bars.reduce((m, b) => Math.max(m, b.utilizadoPct), 0)
  const scaleMax = Math.max(100, maxPct)
  const markerPct = (100 / scaleMax) * 100

  const active = hover !== null ? props.bars[hover.index] : undefined

  return (
    <section className={card} aria-label={props.title}>
      <h3 className={title}>{props.title}</h3>

      {props.bars.length === 0 ? (
        <p className={emptyState}>{props.emptyLabel}</p>
      ) : (
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
                <span className={`${hbarValue} ${valueStatus[b.status]}`}>{b.percentLabel}</span>
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
                <span className={tooltipName}>{active.valueLabel}</span>
                <span className={tooltipVal}>{active.percentLabel}</span>
              </div>
            </div>
          )}
        </div>
      )}

      <button type="button" className={seeAllButton} onClick={props.onSeeAll}>
        {props.seeAllLabel}
      </button>
    </section>
  )
}
