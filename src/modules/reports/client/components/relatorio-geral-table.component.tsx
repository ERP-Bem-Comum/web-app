/**
 * RelatorioGeralTable — tabela do "Relatório Geral" (ledger achatado). View BURRA dirigida por um MODELO de
 * colunas: recebe as linhas JÁ paginadas + as colunas VISÍVEIS (id/rótulo/papel, na ordem) e apenas apresenta.
 * O `grid-template-columns` é composto INLINE só com as colunas visíveis (larguras vêm do `*.css.ts`, §X). Os
 * VALORES são DADO (via `cellText` da ViewModel), não i18n; campos nullable viram o traço "—" (`naLabel`).
 * Rola na HORIZONTAL (muitas colunas) e na vertical (thead sticky). Sem cálculo de domínio aqui (§XI).
 */
import { Fragment, type ReactNode } from 'react'

import type { GeneralColumnId, GeneralColumnKind, LedgerRow } from '../relatorio-geral.view-model.ts'
import { cellText, monthGroupKey, monthGroupLabel } from '../relatorio-geral.view-model.ts'
import {
  COLUMN_WIDTH,
  card,
  cardHeader,
  cardTitle,
  cardCount,
  scroller,
  thead,
  theadValue,
  headCell,
  row,
  cell,
  cellStrong,
  cellValue,
  cellMuted,
  stickyLeft,
  stickyRight,
  stickyLeftHead,
  stickyRightHead,
  monthSep,
  monthSepLabel,
  tipoChip,
  tipoDot,
  empty,
} from './relatorio-geral-table.css.ts'

/** Coluna visível: id (endereça largura + valor), rótulo i18n e papel visual (dirige a classe da célula). */
export type VisibleColumn = Readonly<{ id: GeneralColumnId; label: string; kind: GeneralColumnKind }>

export type RelatorioGeralTableLabels = Readonly<{
  cardTitle: string
  /** contador do cabeçalho, com `{{count}}`. */
  count: string
  /** traço para campo ausente ("—"). */
  naLabel: string
  /** lista de lançamentos vazia. */
  empty: string
  /** nenhuma coluna selecionada no seletor. */
  noColumns: string
}>

export type RelatorioGeralTableProps = Readonly<{
  /** Linhas JÁ paginadas pela View (a View fatia; a tabela só apresenta). */
  rows: readonly LedgerRow[]
  /** Colunas VISÍVEIS (ordem do legado, filtradas pelo seletor). */
  columns: readonly VisibleColumn[]
  /** Total de lançamentos (contador do cabeçalho — não muda ao paginar). */
  totalCount: number
  labels: RelatorioGeralTableLabels
}>

export function RelatorioGeralTable(props: RelatorioGeralTableProps): ReactNode {
  const { labels: L, columns } = props

  // Grid só com as colunas visíveis, na ordem (larguras endereçadas por id — do *.css.ts).
  const gridTemplateColumns = columns.map((c) => COLUMN_WIDTH[c.id] ?? '8rem').join(' ')
  const lastIdx = columns.length - 1
  // Classe da coluna FIXA: a 1ª visível gruda à esquerda; a última, à direita (espelho do legado).
  const stickyOf = (i: number, head: boolean): string => {
    if (i === 0) return head ? stickyLeftHead : stickyLeft
    if (i === lastIdx) return head ? stickyRightHead : stickyRight
    return ''
  }

  /** Célula de uma coluna: texto (ou "—" quando ausente) + classe conforme o papel + fixação por posição. */
  const renderCell = (r: LedgerRow, c: VisibleColumn, i: number): ReactNode => {
    const sticky = stickyOf(i, false)
    const text = cellText(r, c.id)
    // Tipo → CHIP (pílula com bolinha). O #442 é payables-only → um único tom "A pagar".
    if (c.id === 'tipo' && text !== null) {
      return (
        <span className={`${cell} ${sticky}`.trim()}>
          <span className={tipoChip}>
            <span className={tipoDot} aria-hidden="true" />
            {text}
          </span>
        </span>
      )
    }
    if (text === null) return <span className={`${cellMuted} ${sticky}`.trim()}>{L.naLabel}</span>
    switch (c.kind) {
      case 'strong':
        return <span className={`${cellStrong} ${sticky}`.trim()}>{text}</span>
      case 'value':
        return <span className={`${cellValue} ${sticky}`.trim()}>{text}</span>
      case 'plain':
      case 'optional':
        return (
          <span className={`${cell} ${sticky}`.trim()} title={text}>
            {text}
          </span>
        )
    }
  }

  // Corpo com SEPARADORES de mês: uma faixa "Mês / Ano" antes da 1ª linha de cada mês (agrupa por vencimento).
  const body: ReactNode[] = []
  let lastMonthKey = ''
  props.rows.forEach((r, i) => {
    const key = monthGroupKey(r.data)
    if (key !== lastMonthKey) {
      lastMonthKey = key
      body.push(
        <div key={`sep-${key}`} className={monthSep} style={{ gridTemplateColumns }}>
          <span className={monthSepLabel} style={{ gridColumn: '1 / -1' }}>
            {monthGroupLabel(r.data)}
          </span>
        </div>,
      )
    }
    body.push(
      <div
        className={row}
        role="row"
        key={`${r.codigo ?? r.data}-${String(i)}`}
        style={{ gridTemplateColumns }}
      >
        {columns.map((c, ci) => (
          <Fragment key={c.id}>{renderCell(r, c, ci)}</Fragment>
        ))}
      </div>,
    )
  })

  return (
    <div className={card}>
      <div className={cardHeader}>
        <h2 className={cardTitle}>{L.cardTitle}</h2>
        <span className={cardCount}>{L.count.replace('{{count}}', String(props.totalCount))}</span>
      </div>

      {columns.length === 0 ? (
        <p className={empty}>{L.noColumns}</p>
      ) : props.rows.length === 0 ? (
        <p className={empty}>{L.empty}</p>
      ) : (
        <div className={scroller}>
          <div className={thead} role="row" style={{ gridTemplateColumns }}>
            {columns.map((c, i) => (
              <span
                key={c.id}
                className={`${headCell} ${c.kind === 'value' ? theadValue : ''} ${stickyOf(i, true)}`.trim()}
              >
                {c.label}
              </span>
            ))}
          </div>
          {body}
        </div>
      )}
    </div>
  )
}
