/**
 * FluxoCaixaSectionTable — view BURRA da árvore Categoria → Subcategoria de UMA seção do "Fluxo de Caixa"
 * (Saídas ou Entradas), na PELE da tree do relatório "Realizado × Planejado". Recebe a seção JÁ AGREGADA
 * (ViewModel pura) + os rótulos i18n e apresenta: cabeçalho de colunas (nome + as 2 medidas Realizado/Previsto),
 * as linhas em árvore (chevron/recuo/sticky) e o rodapé "Total da seção". Expansão = UI-state local.
 *
 * ── EMPTY STATE HONESTO ── quando a seção vem VAZIA (0 categorias) — o caminho para o qual a seção Entradas
 * cai quando o A-Receber ainda não subiu (fonte `[]`) — renderiza SÓ o cabeçalho do card + um painel único com
 * a mensagem, SEM tabela quebrada. Sem data-hooks, sem cálculo de domínio aqui (ADR-0009, §XI).
 */
import { useMemo, useState, type ReactNode } from 'react'

import { ChevronRightIcon } from '#shared/ui/index.ts'

import type { FluxoNode, FluxoSection, FluxoLevel, FluxoMeasures } from '../fluxo-caixa.view-model.ts'
import { formatBRL } from '../fluxo-caixa.view-model.ts'
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
  tfoot,
  tfootCell,
  gridCols,
  measureTone,
  cellValueNeutral,
  zeroTone,
  emptyPanel,
  emptyTitle,
  emptyHint,
} from './fluxo-caixa-tree-table.css.ts'

/** Chave de medida na ordem canônica das colunas: Realizado → Previsto. */
type MeasureKey = keyof FluxoMeasures
const MEASURE_KEYS: readonly MeasureKey[] = ['realizedCents', 'expectedCents']

export type FluxoCaixaSectionTableLabels = Readonly<{
  /** Título do card da seção (ex.: "Saídas"). */
  cardTitle: string
  nameCol: string
  /** Rótulos das 2 colunas de medida (i18n), keyados pela chave de medida. */
  measureLabels: Readonly<Record<MeasureKey, string>>
  totalRow: string
  expand: string
  collapse: string
  /** Mensagem do empty state (seção sem categorias). */
  empty: string
  /** Complemento (2ª linha) do empty state. */
  emptyHint: string
}>

export type FluxoCaixaSectionTableProps = Readonly<{
  section: FluxoSection
  labels: FluxoCaixaSectionTableLabels
}>

/** Profundidade por nível (0=Categoria, 1=Subcategoria) — dirige recuo e peso do nome. */
const DEPTH: Readonly<Record<FluxoLevel, 0 | 1>> = { category: 0, subcategory: 1 }

// Recuo por nível e padding-base do nome (rem cru em inline-style é permitido; hex/px ficam fora do .css.ts).
const INDENT_REM = '1.375rem'
const BASE_PAD_REM = '0.875rem'

export function FluxoCaixaSectionTable(props: FluxoCaixaSectionTableProps): ReactNode {
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
    const out: FluxoNode[] = []
    const walk = (nodes: readonly FluxoNode[]): void => {
      for (const n of nodes) {
        out.push(n)
        if (n.children.length > 0 && expanded.has(n.id)) walk(n.children)
      }
    }
    walk(props.section.categories)
    return out
  }, [props.section.categories, expanded])

  const isEmpty = props.section.categories.length === 0

  // Célula de nome (chevron/nó-folha/spacer + recuo + nome por nível).
  const renderName = (n: FluxoNode): ReactNode => {
    const depth = DEPTH[n.level]
    const hasChildren = n.children.length > 0
    const isOpen = expanded.has(n.id)
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
        <span className={nameLvl[depth]}>{n.name}</span>
      </div>
    )
  }

  return (
    <div className={card}>
      <div className={cardHeadRow}>
        <h2 className={cardTitle}>{L.cardTitle}</h2>
      </div>

      {isEmpty ? (
        <div className={emptyPanel}>
          <p className={emptyTitle}>{L.empty}</p>
          <p className={emptyHint}>{L.emptyHint}</p>
        </div>
      ) : (
        <div className={scroll}>
          {/* Cabeçalho de colunas */}
          <div className={`${thead} ${gridCols}`}>
            <div className={`${theadCell} ${theadCellStart}`}>{L.nameCol}</div>
            {MEASURE_KEYS.map((k) => (
              <div key={k} className={`${theadCell} ${measureTone[k]}`}>
                {L.measureLabels[k]}
              </div>
            ))}
          </div>

          {/* Linhas da árvore */}
          {visible.map((n) => (
            <div key={n.id} className={`${trow} ${trowLvl[DEPTH[n.level]]} ${gridCols}`}>
              {renderName(n)}
              {MEASURE_KEYS.map((k) => (
                <div key={k} className={`${cell} ${n.measures[k] === 0 ? zeroTone : cellValueNeutral}`}>
                  {formatBRL(n.measures[k])}
                </div>
              ))}
            </div>
          ))}

          {/* Rodapé Total da seção */}
          <div className={`${tfoot} ${gridCols}`}>
            <div className={colFirstHead} style={{ paddingInlineStart: BASE_PAD_REM }}>
              {L.totalRow}
            </div>
            {MEASURE_KEYS.map((k) => (
              <div key={k} className={`${tfootCell} ${cellValueNeutral}`}>
                {formatBRL(props.section.totals[k])}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
