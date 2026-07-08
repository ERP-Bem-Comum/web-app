/**
 * RelatorioGeralTable — tabela do "Relatório Geral" (ledger achatado). View BURRA dirigida por um MODELO de
 * colunas: recebe as linhas JÁ paginadas + as colunas VISÍVEIS (id/rótulo/papel, na ordem) e apenas apresenta.
 * O `grid-template-columns` é composto INLINE só com as colunas visíveis (larguras vêm do `*.css.ts`, §X). Os
 * VALORES são DADO (via `cellText` da ViewModel), não i18n; campos nullable viram o traço "—" (`naLabel`).
 * Rola na HORIZONTAL (muitas colunas) e na vertical (thead sticky). Sem cálculo de domínio aqui (§XI).
 */
import { Fragment, type ReactNode } from 'react'

import type { GeneralColumnId, GeneralColumnKind, LedgerRow } from '../relatorio-geral.view-model.ts'
import { cellText } from '../relatorio-geral.view-model.ts'
import {
  COLUMN_WIDTH,
  card,
  cardHeader,
  cardTitle,
  cardCount,
  scroller,
  thead,
  theadValue,
  row,
  cell,
  cellStrong,
  cellValue,
  cellMuted,
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

  /** Célula de uma coluna: texto (ou "—" quando ausente) + classe conforme o papel. */
  const renderCell = (r: LedgerRow, c: VisibleColumn): ReactNode => {
    const text = cellText(r, c.id)
    if (text === null) return <span className={cellMuted}>{L.naLabel}</span>
    switch (c.kind) {
      case 'strong':
        return <span className={cellStrong}>{text}</span>
      case 'value':
        return <span className={cellValue}>{text}</span>
      case 'plain':
      case 'optional':
        return (
          <span className={cell} title={text}>
            {text}
          </span>
        )
    }
  }

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
            {columns.map((c) => (
              <span key={c.id} className={c.kind === 'value' ? theadValue : undefined}>
                {c.label}
              </span>
            ))}
          </div>

          {props.rows.map((r, i) => (
            <div
              className={row}
              role="row"
              key={`${r.codigo ?? r.data}-${String(i)}`}
              style={{ gridTemplateColumns }}
            >
              {columns.map((c) => (
                <Fragment key={c.id}>{renderCell(r, c)}</Fragment>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
