/**
 * AnaliseTable — matriz TEMPO-orçamentária "Análise por plano orçamentário" do relatório "Análise de
 * Pagamentos". View BURRA: recebe o relatório JÁ AGREGADO (ViewModel pura) + os totais por mês + os rótulos
 * i18n e apresenta a árvore Plano Orçamentário → Centro de Custo com a coluna VALOR TOTAL + uma coluna por MÊS
 * visível (célula = valor do mês) + o rodapé "Valor total do período". A 1ª coluna (nome) é STICKY. Dois
 * UI-states locais: nós expandidos e a janela do passador de meses (WIN=3, meses ASC — o MESMO mecanismo do
 * `realizado-table`). Sem data-hooks, sem cálculo de domínio. Valores em tinta NEUTRA (não colore por célula).
 *
 * Reaproveita a PELE do `realizado-table` (grid sticky, tree, thead/rodapé) e o passador de meses da page do
 * Realizado × Planejado — identidade idêntica, zero duplicação. O `grid-template-columns` é dinâmico (muda com
 * o nº de meses visíveis) → montado aqui e passado por `style={{ gridTemplateColumns }}` inline (rem cru em
 * inline-style é permitido; hex/px ficam fora do `.css.ts`).
 */
import { useMemo, useState, type ReactNode } from 'react'

import { ChevronRightIcon, ChevronLeftIcon } from '#shared/ui/index.ts'

import type { AnaliseReport, AnaliseNode, MonthTotal } from '../analise.view-model.ts'
import { formatBRL, formatMonthLabel } from '../analise.view-model.ts'
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
  tfoot,
  tfootCell,
} from './realizado-table.css.ts'

export type AnaliseTableLabels = Readonly<{
  cardTitle: string
  nameCol: string
  totalCol: string
  totalRow: string
  expand: string
  collapse: string
  prevMonths: string
  nextMonths: string
}>

export type AnaliseTableProps = Readonly<{
  report: AnaliseReport
  /** Totais por mês (na ordem de `report.months`) — precomputados pela page (ViewModel pura). */
  monthTotals: readonly MonthTotal[]
  labels: AnaliseTableLabels
}>

const WIN = 3
// Colunas FLEXÍVEIS (minmax(piso, fr)): a tabela preenche 100% da área. Nome fixo; Total mais largo; meses
// distribuem a folga. Piso mantém "R$ 2.679.837,60" legível.
const COL_NAME = '18rem'
const COL_TOTAL = 'minmax(9rem, 1.4fr)'
const COL_MONTH = 'minmax(7rem, 1fr)'

export function AnaliseTable(props: AnaliseTableProps): ReactNode {
  const L = props.labels
  const months = props.report.months
  // UI-state: nós expandidos + janela do passador.
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set())
  const [start, setStart] = useState(0)

  const win = months.slice(start, start + WIN)

  const gridTemplateColumns = useMemo(() => {
    const monthCols = win.map(() => COL_MONTH).join(' ')
    return `${COL_NAME} ${COL_TOTAL} ${monthCols}`
  }, [win])

  const toggle = (id: string): void => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ── Visíveis (walk da árvore respeitando `expanded`) ──
  const visible = useMemo(() => {
    const out: AnaliseNode[] = []
    const walk = (nodes: readonly AnaliseNode[]): void => {
      for (const r of nodes) {
        out.push(r)
        if (r.children.length > 0 && expanded.has(r.id)) walk(r.children)
      }
    }
    walk(props.report.planos)
    return out
  }, [props.report.planos, expanded])

  const depthOf = (node: AnaliseNode): 0 | 1 => (node.level === 'plano' ? 0 : 1)

  // ── Célula de nome (chevron/nó-folha + recuo + nome) ──
  const renderName = (r: AnaliseNode): ReactNode => {
    const depth = depthOf(r)
    const hasChildren = r.children.length > 0
    const isOpen = expanded.has(r.id)
    const lvlBg = depth === 1 ? colFirstLvl[1] : colFirstHoverSync
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
    } else if (depth === 0) {
      lead = <span className={chevSpacer} aria-hidden="true" />
    } else {
      lead = <span className={treeNode} aria-hidden="true" />
    }
    // Recuo por nível via padding-inline-start (rem cru em inline-style é permitido).
    const padStart = `calc(${String(depth)} * ${INDENT_REM} + ${BASE_PAD_REM})`
    return (
      <div className={`${colFirst} ${lvlBg}`} style={{ paddingInlineStart: padStart }}>
        {lead}
        <span className={nameLvl[depth]}>{r.name}</span>
      </div>
    )
  }

  const renderMoney = (value: number, sub: boolean): ReactNode =>
    value === 0 ? (
      <span className={zero}>{formatBRL(value)}</span>
    ) : (
      <span className={sub ? planValSub : planVal}>{formatBRL(value)}</span>
    )

  // ── Células por mês visível ──
  const renderMonths = (r: AnaliseNode): ReactNode => {
    const depth = depthOf(r)
    return win.map((mKey, i) => {
      const value = r.monthCells[mKey] ?? 0
      return (
        <div key={mKey} className={i === 0 ? cellMonthFirst : cell}>
          {renderMoney(value, depth === 1)}
        </div>
      )
    })
  }

  const monthTotalMap = new Map(props.monthTotals.map((m) => [m.key, m.valueCents]))
  const firstLabel = win[0] !== undefined ? formatMonthLabel(win[0]) : ''
  const lastLabel = win[win.length - 1] !== undefined ? formatMonthLabel(win[win.length - 1] ?? '') : ''

  return (
    <div className={card}>
      <div className={cardHeader}>
        <h2 className={cardTitle}>{L.cardTitle}</h2>
        <div className={pager}>
          <span className={pagerLabel}>{win.length > 0 ? `${firstLabel} – ${lastLabel}` : ''}</span>
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
            disabled={start + WIN >= months.length}
            onClick={() => {
              setStart((s) => Math.min(Math.max(0, months.length - WIN), s + WIN))
            }}
          >
            <ChevronRightIcon size={16} />
          </button>
        </div>
      </div>

      <div className={scroll}>
        {/* thead — nome + Valor total + meses visíveis */}
        <div className={thead2} style={{ gridTemplateColumns }}>
          <div className={`${colFirstHead} ${thead2CellStart}`}>{L.nameCol}</div>
          <div className={thead2Cell}>{L.totalCol}</div>
          {win.map((mKey, i) => (
            <div key={mKey} className={i === 0 ? thead2CellMonthFirst : thead2Cell}>
              {formatMonthLabel(mKey)}
            </div>
          ))}
        </div>

        {/* linhas */}
        {visible.map((r) => {
          const depth = depthOf(r)
          return (
            <div key={r.id} className={`${trow} ${trowLvl[depth]}`} style={{ gridTemplateColumns }}>
              {renderName(r)}
              <div className={cell}>{renderMoney(r.total, depth === 1)}</div>
              {renderMonths(r)}
            </div>
          )
        })}

        {/* rodapé Valor total do período */}
        <div className={tfoot} style={{ gridTemplateColumns }}>
          <div className={colFirstHead} style={{ paddingInlineStart: BASE_PAD_REM }}>
            {L.totalRow}
          </div>
          <div className={tfootCell}>{formatBRL(props.report.totalPeriodo)}</div>
          {win.map((mKey, i) => (
            <div key={mKey} className={i === 0 ? `${tfootCell} ${cellMonthFirst}` : tfootCell}>
              {formatBRL(monthTotalMap.get(mKey) ?? 0)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Recuo por nível (22px→rem) e o padding-base do nome (14px→rem) — o mock usa 14 + nível*22.
const INDENT_REM = '1.375rem'
const BASE_PAD_REM = '0.875rem'
