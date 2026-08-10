/**
 * RealizadoTable — tabela "Detalhamento por mês" (mock). View BURRA: recebe a árvore já agregada (ViewModel
 * pura) + o grand total + os rótulos i18n e apresenta: cabeçalho de grupos ("Consolidado do ano" + um grupo
 * por mês visível), sub-colunas, as linhas em árvore (Centro de Custo → Categoria → Subcategoria) e o rodapé
 * "Total". A 1ª coluna (Centro de custo) é STICKY. Dois UI-states locais: nós expandidos e a janela do
 * passador de meses (WIN=3, meses em ordem CRESCENTE Jan→Dez). Sem data-hooks, sem cálculo de domínio.
 *
 * O `grid-template-columns` é dinâmico (muda com o nº de meses visíveis) → montado aqui e passado por
 * `style={{ gridTemplateColumns }}` inline (rem cru em inline-style é permitido; hex/px ficam fora do .css.ts).
 */
import { Fragment, useMemo, useState, type ReactNode } from 'react'

import { ChevronRightIcon, ChevronLeftIcon } from '#shared/ui/index.ts'

import type { BudgetTreeRow, GrandTotal, MonthMeasures } from '../realizado-x-planejado.view-model.ts'
import { formatBRL, formatPercent, computeAvPct } from '../realizado-x-planejado.view-model.ts'
import {
  card,
  cardHeader,
  cardTitle,
  pager,
  pagerLabel,
  pagerButton,
} from '../page/realizado-x-planejado.page.css.ts'
import {
  scroll,
  thead1,
  thead1Cell,
  thead1CellFirst,
  thead2,
  thead2Cell,
  thead2CellStart,
  thead2CellMonthFirst,
  trow,
  trowLvl,
  cell,
  cellMonthFirst,
  colFirst,
  colFirstHead,
  colFirstHead1,
  colFirstLvl,
  colFirstHoverSync,
  chev,
  chevIcon,
  chevIconOpen,
  chevSpacer,
  treeNode,
  nameLvl,
  zero,
  planVal,
  planValSub,
  av,
  avBar,
  avFill,
  tfoot,
  tfootCell,
} from './realizado-table.css.ts'

export type RealizadoTableLabels = Readonly<{
  cardTitle: string
  centroCusto: string
  provisionado: string
  realizado: string
  planejado: string
  av: string
  provisAbbrev: string
  realizAbbrev: string
  planejAbbrev: string
  consolidatedGroup: string
  totalRow: string
  monthAbbrev: readonly string[] // 12 abreviações jan..dez (ex.: "Dez")
  yearSuffix: string // ex.: "26"
  expand: string
  collapse: string
  prevMonths: string
  nextMonths: string
}>

export type RealizadoTableProps = Readonly<{
  rows: readonly BudgetTreeRow[]
  total: GrandTotal
  labels: RealizadoTableLabels
}>

const WIN = 3
// Colunas FLEXÍVEIS (minmax(piso, fr)): a tabela preenche 100% da área e NUNCA fica mais larga que o
// container → sem scroll horizontal (a menos que a área seja menor que a soma dos pisos). O piso mantém os
// números grandes legíveis (planejado ~8.75rem cabe "R$ 2.679.837,60"); o fr distribui a folga em telas
// largas. Nome fixo (nomes longos quebram em 2 linhas). Soma dos pisos ≈ 95rem.
const COL_NAME = '16rem'
const COL_PROV = 'minmax(6.5rem, 1fr)'
const COL_REAL = 'minmax(6.5rem, 1fr)'
const COL_PLAN = 'minmax(9rem, 1.4fr)'
const COL_AV = 'minmax(4.25rem, 0.7fr)'
const COL_M_PROV = 'minmax(4.5rem, 0.85fr)'
const COL_M_REAL = 'minmax(4.5rem, 0.85fr)'
const COL_M_PLAN = 'minmax(8.75rem, 1.4fr)'

const emptyCell = (month: number): MonthMeasures => ({
  month,
  provisionadoCents: 0,
  realizadoCents: 0,
  planejadoCents: 0,
})

export function RealizadoTable(props: RealizadoTableProps): ReactNode {
  const L = props.labels
  // UI-state: nós expandidos + janela do passador.
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set())
  const [start, setStart] = useState(0)

  // Meses em ordem CRESCENTE (0=Jan … 11=Dez) — padrão dos módulos de orçamento (Jan, Fev, Mar…).
  const monthsAsc = useMemo(() => Array.from({ length: 12 }, (_, i) => i), [])
  const win = monthsAsc.slice(start, start + WIN)

  const gridTemplateColumns = useMemo(() => {
    const monthCols = win.map(() => `${COL_M_PROV} ${COL_M_REAL} ${COL_M_PLAN}`).join(' ')
    return `${COL_NAME} ${COL_PROV} ${COL_REAL} ${COL_PLAN} ${COL_AV} ${monthCols}`
  }, [win])

  const toggle = (id: string): void => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const monthLabel = (index: number): string => `${L.monthAbbrev[index] ?? ''}/${L.yearSuffix}`
  const monthMap = (months: readonly MonthMeasures[]): ReadonlyMap<number, MonthMeasures> =>
    new Map(months.map((m) => [m.month, m]))

  // ── Visíveis (walk da árvore respeitando `expanded`) ──
  const visible = useMemo(() => {
    const out: { r: BudgetTreeRow }[] = []
    const walk = (nodes: readonly BudgetTreeRow[]): void => {
      for (const r of nodes) {
        out.push({ r })
        if (r.children.length > 0 && expanded.has(r.id)) walk(r.children)
      }
    }
    walk(props.rows)
    return out
  }, [props.rows, expanded])

  // ── Célula de nome (chevron/dot/spacer + recuo + nome) ──
  const renderName = (r: BudgetTreeRow): ReactNode => {
    const hasChildren = r.children.length > 0
    const isOpen = expanded.has(r.id)
    const lvlBg = r.depth === 1 ? colFirstLvl[1] : r.depth === 2 ? colFirstLvl[2] : colFirstHoverSync
    let lead: ReactNode
    if (hasChildren) {
      lead = (
        <button
          type="button"
          className={chev}
          aria-expanded={isOpen}
          aria-label={isOpen ? L.collapse : L.expand}
          onClick={() => {
            toggle(r.id)
          }}
        >
          <span className={`${chevIcon} ${isOpen ? chevIconOpen : ''}`}>
            <ChevronRightIcon size={15} />
          </span>
        </button>
      )
    } else if (r.depth === 0) {
      lead = <span className={chevSpacer} aria-hidden="true" />
    } else {
      lead = <span className={treeNode} aria-hidden="true" />
    }
    // Recuo por nível via padding-inline-start (rem cru em inline-style é permitido).
    const padStart = `calc(${String(r.depth)} * ${INDENT_REM} + ${BASE_PAD_REM})`
    return (
      <div className={`${colFirst} ${lvlBg}`} style={{ paddingInlineStart: padStart }}>
        {lead}
        <span className={nameLvl[r.depth]}>{r.name}</span>
      </div>
    )
  }

  // ── Células consolidadas (Provisionado/Realizado zero, Planejado, AV%) ──
  const renderConsolidated = (r: BudgetTreeRow): ReactNode => (
    <>
      <div className={`${cell} ${zero}`}>{formatBRL(r.totals.provisionadoCents)}</div>
      <div className={`${cell} ${zero}`}>{formatBRL(r.totals.realizadoCents)}</div>
      <div className={cell}>
        <span className={r.depth === 2 ? planValSub : planVal}>{formatBRL(r.totals.planejadoCents)}</span>
      </div>
      <div className={cell}>
        <span className={av}>
          <span className={avBar}>
            <span className={avFill} style={{ inlineSize: `${String(Math.min(100, r.avPct))}%` }} />
          </span>
          {formatPercent(r.avPct)}
        </span>
      </div>
    </>
  )

  // ── Células por mês visível (Provis./Realiz. zero, Planej.) ──
  const renderMonths = (r: BudgetTreeRow): ReactNode => {
    const map = monthMap(r.months)
    return win.map((mi) => {
      const m = map.get(mi) ?? emptyCell(mi)
      return (
        <Fragment key={mi}>
          <div className={`${cellMonthFirst} ${zero}`}>{formatBRL(m.provisionadoCents)}</div>
          <div className={`${cell} ${zero}`}>{formatBRL(m.realizadoCents)}</div>
          <div className={cell}>
            <span className={r.depth === 2 ? planValSub : planVal}>{formatBRL(m.planejadoCents)}</span>
          </div>
        </Fragment>
      )
    })
  }

  const totalMap = monthMap(props.total.months)

  return (
    <div className={card}>
      <div className={cardHeader}>
        <h2 className={cardTitle}>{L.cardTitle}</h2>
        <div className={pager}>
          <span className={pagerLabel}>
            {win.length > 0 ? `${monthLabel(win[0] ?? 0)} – ${monthLabel(win[win.length - 1] ?? 0)}` : ''}
          </span>
          <button
            type="button"
            className={pagerButton}
            aria-label={L.prevMonths}
            disabled={start === 0}
            onClick={() => {
              setStart((s) => Math.max(0, s - WIN))
            }}
          >
            <ChevronLeftIcon size={16} />
          </button>
          <button
            type="button"
            className={pagerButton}
            aria-label={L.nextMonths}
            disabled={start + WIN >= monthsAsc.length}
            onClick={() => {
              setStart((s) => Math.min(monthsAsc.length - WIN, s + WIN))
            }}
          >
            <ChevronRightIcon size={16} />
          </button>
        </div>
      </div>

      <div className={scroll}>
        {/* thead1 — grupos */}
        <div className={thead1} style={{ gridTemplateColumns }}>
          <div className={colFirstHead1} />
          <div className={thead1CellFirst} style={{ gridColumn: '2 / span 4' }}>
            {L.consolidatedGroup}
          </div>
          {win.map((mi, i) => (
            <div key={mi} className={thead1Cell} style={{ gridColumn: `${String(6 + i * 3)} / span 3` }}>
              {monthLabel(mi)}
            </div>
          ))}
        </div>

        {/* thead2 — sub-colunas */}
        <div className={thead2} style={{ gridTemplateColumns }}>
          <div className={`${colFirstHead} ${thead2CellStart}`}>{L.centroCusto}</div>
          <div className={thead2Cell}>{L.provisionado}</div>
          <div className={thead2Cell}>{L.realizado}</div>
          <div className={thead2Cell}>{L.planejado}</div>
          <div className={thead2Cell}>{L.av}</div>
          {win.map((mi) => (
            <Fragment key={mi}>
              <div className={thead2CellMonthFirst}>{L.provisAbbrev}</div>
              <div className={thead2Cell}>{L.realizAbbrev}</div>
              <div className={thead2Cell}>{L.planejAbbrev}</div>
            </Fragment>
          ))}
        </div>

        {/* linhas */}
        {visible.map(({ r }) => (
          <div key={r.id} className={`${trow} ${trowLvl[r.depth]}`} style={{ gridTemplateColumns }}>
            {renderName(r)}
            {renderConsolidated(r)}
            {renderMonths(r)}
          </div>
        ))}

        {/* rodapé Total */}
        <div className={tfoot} style={{ gridTemplateColumns }}>
          <div className={colFirstHead} style={{ paddingInlineStart: BASE_PAD_REM }}>
            {L.totalRow}
          </div>
          <div className={`${tfootCell} ${zero}`}>{formatBRL(props.total.provisionadoCents)}</div>
          <div className={`${tfootCell} ${zero}`}>{formatBRL(props.total.realizadoCents)}</div>
          <div className={tfootCell}>{formatBRL(props.total.planejadoCents)}</div>
          <div className={tfootCell}>{formatPercent(computeAvPct(props.total))}</div>
          {win.map((mi) => {
            const m = totalMap.get(mi) ?? emptyCell(mi)
            return (
              <Fragment key={mi}>
                <div className={`${tfootCell} ${cellMonthFirst} ${zero}`}>
                  {formatBRL(m.provisionadoCents)}
                </div>
                <div className={`${tfootCell} ${zero}`}>{formatBRL(m.realizadoCents)}</div>
                <div className={tfootCell}>{formatBRL(m.planejadoCents)}</div>
              </Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Recuo por nível (22px→rem) e o padding-base do nome (14px→rem) — o mock usa 14 + nível*22.
const INDENT_REM = '1.375rem'
const BASE_PAD_REM = '0.875rem'
