/**
 * OrcamentoGrid — view BURRA (§XI) do grid CATEGORIAS×meses da edição de Orçamento (US2.4). Reaproveita os
 * estilos de tabela da matriz consolidada (mesmo visual: cabeçalho/rodapé azul, linhas-filhas claras,
 * conector). Categorias = linhas raiz (expansíveis) → subcategorias. Cada linha tem o ícone de calculadora
 * que abre "Calculando Gastos" (2.4b). Expansão = UI-state local.
 */
import { Fragment, useState, type ReactNode } from 'react'

import { ChevronDownIcon, ChevronUpIcon, CalculatorIcon } from '#shared/ui/index.ts'
import type {
  MatrixView,
  MatrixRow,
} from '#modules/budget-plans/client/planejamento/detalhe/plan-detail.view-model.ts'

import {
  container,
  table,
  th,
  thMonth,
  row,
  childRow,
  nameCell,
  connector,
  connectorDot,
  chevronButton,
  nameText,
  rowName,
  rowNameChild,
  ccSubtotal,
  monthCell,
  totalRow,
  totalLabelCell,
  totalMonthCell,
} from '../components/consolidated-matrix.css.ts'
import { calcButton, clickableRow } from './orcamento.css.ts'

export type OrcamentoGridLabels = Readonly<{
  categoriesHeader: string
  calcRow: string
  expand: string
  collapse: string
}>

export type OrcamentoGridProps = Readonly<{
  matrix: MatrixView
  labels: OrcamentoGridLabels
  /** Abre "Calculando Gastos" para a linha (2.4b). Vale p/ o ícone de calculadora e p/ a linha-filha. */
  onCalcular: (rowId: number) => void
}>

export function OrcamentoGrid(props: OrcamentoGridProps): ReactNode {
  const [expanded, setExpanded] = useState<ReadonlySet<number>>(new Set())

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
    const isChild = r.depth > 0
    // Linha-filha (subcategoria): clicar em qualquer ponto abre "Calculando Gastos" (frame).
    const rowClass = isChild ? `${childRow} ${clickableRow}` : row
    return (
      <Fragment key={`${String(r.depth)}-${String(r.id)}`}>
        <tr
          className={rowClass}
          onClick={
            isChild
              ? () => {
                  props.onCalcular(r.id)
                }
              : undefined
          }
        >
          <td>
            <div className={nameCell}>
              {isChild ? (
                <span className={connector} aria-hidden="true">
                  <span className={connectorDot} />
                </span>
              ) : null}
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
              ) : null}
              <span className={nameText}>
                <span className={isChild ? rowNameChild : rowName}>{r.name}</span>
                <span className={ccSubtotal}>{r.totalLabel}</span>
              </span>
              <button
                type="button"
                className={calcButton}
                aria-label={props.labels.calcRow}
                onClick={(e) => {
                  e.stopPropagation()
                  props.onCalcular(r.id)
                }}
              >
                <CalculatorIcon size={16} />
              </button>
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
    <div className={container}>
      <table className={table}>
        <thead>
          <tr>
            <th className={th}>{props.labels.categoriesHeader}</th>
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
            <td className={totalLabelCell}>{props.matrix.total.totalLabel}</td>
            {props.matrix.total.cellLabels.map((label, i) => (
              <td key={i} className={totalMonthCell}>
                {label}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
