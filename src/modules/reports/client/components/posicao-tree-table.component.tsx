/**
 * PosicaoTreeTable — view BURRA da árvore Fornecedor → Centro de Custo → Categoria (relatório "Posição de
 * Pagamentos"), na PELE da tree do relatório "Realizado × Planejado" (fundos por nível childBg1/childBg2,
 * nó-folha, 1ª coluna sticky). Recebe o relatório já agregado (ViewModel pura) + os rótulos i18n e apresenta:
 * cabeçalho de colunas (nome + as 3 medidas derivadas Em atraso/Pago/A pagar), as linhas em árvore
 * (chevron/recuo/sticky; o subtotal é a própria linha-pai, e o FORNECEDOR mostra seu total como subtítulo) e o
 * rodapé "Total Geral". Expansão = UI-state local. Sem data-hooks, sem cálculo de domínio aqui.
 */
import { useMemo, useState, type ReactNode } from 'react'

import { ChevronRightIcon } from '#shared/ui/index.ts'

import type { PosicaoNode, PosicaoReport, PosicaoLevel, PosicaoMeasures } from '../posicao.view-model.ts'
import { formatBRL, measureTotal } from '../posicao.view-model.ts'
import {
  card,
  cardHeadRow,
  cardTitle,
  scroll,
  thead,
  theadCell,
  theadCellStart,
  trow,
  trowLvl,
  cell,
  colFirst,
  colFirstLvl,
  colFirstHoverSync,
  colFirstHead,
  chev,
  chevIcon,
  chevIconOpen,
  chevSpacer,
  treeNode,
  nameLvl,
  nameStack,
  nameSub,
  tfoot,
  tfootCell,
  gridCols,
  measureTone,
  zeroTone,
} from './posicao-tree-table.css.ts'

/** Chave de medida na ordem canônica das colunas: Em atraso → Pago → A pagar. */
type MeasureKey = keyof PosicaoMeasures
const MEASURE_KEYS: readonly MeasureKey[] = ['emAtrasoCents', 'pagoCents', 'aPagarCents']

export type PosicaoTreeTableLabels = Readonly<{
  cardTitle: string
  nameCol: string
  /** Rótulos das 3 colunas de medida (i18n), keyados pela chave de medida. */
  measureLabels: Readonly<Record<MeasureKey, string>>
  totalRow: string
  expand: string
  collapse: string
}>

export type PosicaoTreeTableProps = Readonly<{
  report: PosicaoReport
  labels: PosicaoTreeTableLabels
}>

/** Profundidade por nível (0=Fornecedor, 1=Centro de Custo, 2=Categoria) — dirige recuo e peso do nome. */
const DEPTH: Readonly<Record<PosicaoLevel, 0 | 1 | 2>> = { supplier: 0, costCenter: 1, category: 2 }

// Recuo por nível e padding-base do nome (rem cru em inline-style é permitido; hex/px ficam fora do .css.ts).
const INDENT_REM = '1.375rem'
const BASE_PAD_REM = '0.875rem'

export function PosicaoTreeTable(props: PosicaoTreeTableProps): ReactNode {
  const L = props.labels
  // UI-state local: nós expandidos.
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set())

  const toggle = (id: string): void => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Linhas visíveis (walk da árvore respeitando `expanded`).
  const visible = useMemo(() => {
    const out: PosicaoNode[] = []
    const walk = (nodes: readonly PosicaoNode[]): void => {
      for (const n of nodes) {
        out.push(n)
        if (n.children.length > 0 && expanded.has(n.id)) walk(n.children)
      }
    }
    walk(props.report.suppliers)
    return out
  }, [props.report.suppliers, expanded])

  // Célula de nome (chevron/nó-folha/spacer + recuo + nome por nível + subtítulo de total no fornecedor).
  const renderName = (n: PosicaoNode): ReactNode => {
    const depth = DEPTH[n.level]
    const hasChildren = n.children.length > 0
    const isOpen = expanded.has(n.id)
    const lvlBg = depth === 1 ? colFirstLvl[1] : depth === 2 ? colFirstLvl[2] : colFirstHoverSync
    let lead: ReactNode
    if (hasChildren) {
      lead = (
        <button
          type="button"
          className={chev}
          aria-expanded={isOpen}
          aria-label={isOpen ? L.collapse : L.expand}
          onClick={() => {
            toggle(n.id)
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
    const padStart = `calc(${String(depth)} * ${INDENT_REM} + ${BASE_PAD_REM})`
    return (
      <div className={`${colFirst} ${lvlBg}`} style={{ paddingInlineStart: padStart }}>
        {lead}
        <span className={nameStack}>
          <span className={nameLvl[depth]}>{n.name}</span>
          {depth === 0 && <span className={nameSub}>{formatBRL(measureTotal(n.measures))}</span>}
        </span>
      </div>
    )
  }

  return (
    <div className={card}>
      <div className={cardHeadRow}>
        <h2 className={cardTitle}>{L.cardTitle}</h2>
      </div>

      <div className={scroll}>
        {/* Cabeçalho de colunas */}
        <div className={`${thead} ${gridCols}`}>
          <div className={`${colFirstHead} ${theadCellStart}`}>{L.nameCol}</div>
          {MEASURE_KEYS.map((k) => (
            <div key={k} className={theadCell}>
              {L.measureLabels[k]}
            </div>
          ))}
        </div>

        {/* Linhas da árvore */}
        {visible.map((n) => (
          <div key={n.id} className={`${trow} ${trowLvl[DEPTH[n.level]]} ${gridCols}`}>
            {renderName(n)}
            {MEASURE_KEYS.map((k) => (
              <div key={k} className={`${cell} ${n.measures[k] === 0 ? zeroTone : measureTone[k]}`}>
                {formatBRL(n.measures[k])}
              </div>
            ))}
          </div>
        ))}

        {/* Rodapé Total Geral */}
        <div className={`${tfoot} ${gridCols}`}>
          <div className={colFirstHead} style={{ paddingInlineStart: BASE_PAD_REM }}>
            {L.totalRow}
          </div>
          {MEASURE_KEYS.map((k) => (
            <div key={k} className={`${tfootCell} ${measureTone[k]}`}>
              {formatBRL(props.report.totals[k])}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
