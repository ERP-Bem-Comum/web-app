import { Fragment, useState, type ReactNode } from 'react'

import { ChevronDownIcon, ChevronUpIcon } from '#shared/ui/index.ts'
import type {
  MatrixView,
  MatrixRow,
} from '#modules/budget-plans/client/planejamento/detalhe/plan-detail.view-model.ts'

import {
  section,
  sectionHeader,
  sectionTitle,
  controls,
  toggleGroup,
  toggle,
  toggleActive,
  navButton,
  navDisabled,
  container,
  table,
  th,
  thMonth,
  row,
  nameCell,
  indent,
  chevronButton,
  nameText,
  ccSubtotal,
  monthCell,
  totalRow,
  totalLabelCell,
  totalMonthCell,
} from './consolidated-matrix.css.ts'

export type ConsolidatedMatrixLabels = Readonly<{
  sectionTitle: string
  centroCusto: string
  porMes: string
  porRede: string
  prev: string
  next: string
  centrosHeader: string
  total: string
  expand: string
  collapse: string
}>

export type ConsolidatedMatrixProps = Readonly<{
  matrix: MatrixView
  labels: ConsolidatedMatrixLabels
  /** Alterna o semestre (‹ ›) — só faz sentido na visão por mês. */
  onPrev: () => void
  onNext: () => void
  /** Toggles de visão: abre gestão de Centros de Custo / alterna Por Mês / Por Rede. */
  onSelectCentroCusto: () => void
  onSelectPorMes: () => void
  onSelectPorRede: () => void
}>

/**
 * Matriz consolidada (view BURRA) — serve às visões "Por Mês" e "Por Rede" (mesmo shape `MatrixView`).
 * Linhas em árvore expansíveis + linha TOTAL. Expansão = UI-state local (não server-state).
 */
export function ConsolidatedMatrix(props: ConsolidatedMatrixProps): ReactNode {
  const [expanded, setExpanded] = useState<ReadonlySet<number>>(new Set())
  const isMonth = props.matrix.kind === 'month'

  const toggleRow = (id: number): void => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const renderRow = (r: MatrixRow): ReactNode => {
    const hasChildren = r.children.length > 0
    const isOpen = expanded.has(r.id)
    return (
      <Fragment key={`${String(r.depth)}-${String(r.id)}`}>
        <tr className={row}>
          <td>
            <div className={nameCell}>
              {Array.from({ length: r.depth }, (_, i) => (
                <span key={i} className={indent} aria-hidden="true" />
              ))}
              {hasChildren ? (
                <button
                  type="button"
                  className={chevronButton}
                  aria-expanded={isOpen}
                  aria-label={isOpen ? props.labels.collapse : props.labels.expand}
                  onClick={() => {
                    toggleRow(r.id)
                  }}
                >
                  {isOpen ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />}
                </button>
              ) : (
                <span className={indent} aria-hidden="true" />
              )}
              <span className={nameText}>
                {r.name}
                <span className={ccSubtotal}>{r.totalLabel}</span>
              </span>
            </div>
          </td>
          {r.cellLabels.map((label, i) => (
            <td key={i} className={monthCell}>
              {label}
            </td>
          ))}
        </tr>
        {hasChildren && isOpen ? r.children.map((child) => renderRow(child)) : null}
      </Fragment>
    )
  }

  return (
    <div className={section}>
      <div className={sectionHeader}>
        <h2 className={sectionTitle}>{props.labels.sectionTitle}</h2>
        <div className={controls}>
          <div className={toggleGroup} role="group">
            <button type="button" className={toggle} onClick={props.onSelectCentroCusto}>
              {props.labels.centroCusto}
            </button>
            <button
              type="button"
              className={isMonth ? `${toggle} ${toggleActive}` : toggle}
              aria-pressed={isMonth}
              onClick={props.onSelectPorMes}
            >
              {props.labels.porMes}
            </button>
            <button
              type="button"
              className={isMonth ? toggle : `${toggle} ${toggleActive}`}
              aria-pressed={!isMonth}
              onClick={props.onSelectPorRede}
            >
              {props.labels.porRede}
            </button>
          </div>
          <button
            type="button"
            className={!isMonth || props.matrix.semester === 0 ? `${navButton} ${navDisabled}` : navButton}
            aria-label={props.labels.prev}
            disabled={!isMonth || props.matrix.semester === 0}
            onClick={props.onPrev}
          >
            {'‹'}
          </button>
          <button
            type="button"
            className={!isMonth || props.matrix.semester === 1 ? `${navButton} ${navDisabled}` : navButton}
            aria-label={props.labels.next}
            disabled={!isMonth || props.matrix.semester === 1}
            onClick={props.onNext}
          >
            {'›'}
          </button>
        </div>
      </div>

      <div className={container}>
        <table className={table}>
          <thead>
            <tr>
              <th className={th}>{props.labels.centrosHeader}</th>
              {props.matrix.columnHeaders.map((h) => (
                <th key={h} className={thMonth}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{props.matrix.rows.map((r) => renderRow(r))}</tbody>
          <tfoot>
            <tr className={totalRow}>
              <td className={totalLabelCell}>
                {props.labels.total}: {props.matrix.total.totalLabel}
              </td>
              {props.matrix.total.cellLabels.map((label, i) => (
                <td key={i} className={totalMonthCell}>
                  {label}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
