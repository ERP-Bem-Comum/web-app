/**
 * SupplierTreeTable — view BURRA da árvore fornecedor → plano orçamentário (relatório "Fornecedores sem
 * Contrato"). Recebe as linhas já agregadas + formatadas (via ViewModel pura) e apresenta: linha-pai com
 * chevron (expande os planos), 3 colunas numéricas (VALOR TOTAL, % UTILIZADO, RESTANTE) e o estado de
 * estouro (linha danger). Expansão = UI-state local (não server-state). Sem data-hooks, sem cálculo aqui.
 */
import { Fragment, useState, type ReactNode } from 'react'

import { ChevronDownIcon, ChevronUpIcon } from '#shared/ui/index.ts'

import type { SupplierRow } from '../suppliers-without-contract.view-model.ts'
import { formatBRL, formatPercent } from '../suppliers-without-contract.view-model.ts'
import {
  card,
  thead,
  theadNum,
  supplierRow,
  supplierRowDanger,
  supplierRowAtLimit,
  planRow,
  nameCell,
  supplierName,
  indent,
  planName,
  chevronButton,
  numCell,
  numTone,
  stateRow,
} from './supplier-tree-table.css.ts'

export type SupplierTreeTableLabels = Readonly<{
  supplier: string
  valorTotal: string
  utilizado: string
  restante: string
  expand: string
  collapse: string
  empty: string
}>

export type SupplierTreeTableProps = Readonly<{
  rows: readonly SupplierRow[]
  labels: SupplierTreeTableLabels
}>

export function SupplierTreeTable(props: SupplierTreeTableProps): ReactNode {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set())

  const toggle = (supplier: string): void => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(supplier)) next.delete(supplier)
      else next.add(supplier)
      return next
    })
  }

  const L = props.labels

  return (
    <div className={card} role="table" aria-label={L.supplier}>
      <div className={thead} role="row">
        <div role="columnheader">{L.supplier}</div>
        <div role="columnheader" className={theadNum}>
          {L.valorTotal}
        </div>
        <div role="columnheader" className={theadNum}>
          {L.utilizado}
        </div>
        <div role="columnheader" className={theadNum}>
          {L.restante}
        </div>
      </div>

      <div role="rowgroup">
        {props.rows.length === 0 ? (
          <div className={stateRow}>{L.empty}</div>
        ) : (
          props.rows.map((r) => {
            const isOpen = expanded.has(r.supplier)
            const restanteDanger = r.totalRestanteCents < 0
            return (
              <Fragment key={r.supplier}>
                <div
                  className={r.overLimit ? supplierRowDanger : r.atLimit ? supplierRowAtLimit : supplierRow}
                  role="row"
                >
                  <div className={nameCell} role="cell">
                    <button
                      type="button"
                      className={chevronButton}
                      aria-expanded={isOpen}
                      aria-label={isOpen ? L.collapse : L.expand}
                      onClick={() => {
                        toggle(r.supplier)
                      }}
                    >
                      {isOpen ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />}
                    </button>
                    <span className={supplierName}>{r.supplier}</span>
                  </div>
                  <div className={numCell} role="cell">
                    {formatBRL(r.valorTotalCents)}
                  </div>
                  <div className={r.overLimit ? `${numCell} ${numTone.danger}` : numCell} role="cell">
                    {formatPercent(r.utilizadoPct)}
                  </div>
                  <div className={restanteDanger ? `${numCell} ${numTone.danger}` : numCell} role="cell">
                    {formatBRL(r.totalRestanteCents)}
                  </div>
                </div>

                {isOpen
                  ? r.plans.map((p) => (
                      <div key={p.budgetPlan} className={planRow} role="row">
                        <div className={nameCell} role="cell">
                          <span className={indent} aria-hidden="true" />
                          <span className={planName}>{p.budgetPlan}</span>
                        </div>
                        <div className={numCell} role="cell">
                          {formatBRL(p.totalCents)}
                        </div>
                        <div className={numCell} role="cell" aria-hidden="true" />
                        <div className={numCell} role="cell" aria-hidden="true" />
                      </div>
                    ))
                  : null}
              </Fragment>
            )
          })
        )}
      </div>
    </div>
  )
}
