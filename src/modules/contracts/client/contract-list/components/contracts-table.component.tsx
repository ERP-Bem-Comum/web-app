/**
 * ContractsTable — componente BURRO de tabela de contratos (replicação v1).
 * Recebe dados e renderRow por props. Zero estado/fetch.
 */
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import type { ContractRow } from '#modules/contracts/client/contract-list/contract-list.view-model.ts'
import {
  container,
  table,
  thead,
  thCell,
  colNumber,
  colContractor,
  colObject,
  colType,
  colProgram,
  colCurrentValue,
  colBalance,
  colPeriod,
  colAdditives,
  colStatus,
  colActions,
  emptyRow,
  emptyCell,
} from './contracts-table.css.ts'

const t = createTranslator(ptBR)

export interface ContractsTableProps {
  readonly rows: readonly ContractRow[]
  readonly renderRow: (row: ContractRow, index: number) => ReactNode
}

export function ContractsTable({ rows, renderRow }: ContractsTableProps): ReactNode {
  return (
    <div className={container}>
      <table className={table}>
        <thead className={thead}>
          <tr>
            <th className={`${thCell} ${colNumber}`}>
              {t('contracts.table.columns.number')}
            </th>
            <th className={`${thCell} ${colContractor}`}>
              {t('contracts.table.columns.contractor')}
            </th>
            <th className={`${thCell} ${colObject}`}>
              {t('contracts.table.columns.object')}
            </th>
            <th className={`${thCell} ${colType}`}>
              {t('contracts.table.columns.type')}
            </th>
            <th className={`${thCell} ${colProgram}`}>
              {t('contracts.table.columns.program')}
            </th>
            <th className={`${thCell} ${colCurrentValue}`}>
              {t('contracts.table.columns.currentValue')}
            </th>
            <th className={`${thCell} ${colBalance}`}>
              {t('contracts.table.columns.balance')}
            </th>
            <th className={`${thCell} ${colPeriod}`}>
              {t('contracts.table.columns.period')}
            </th>
            <th className={`${thCell} ${colAdditives}`}>
              {t('contracts.table.columns.additives')}
            </th>
            <th className={`${thCell} ${colStatus}`}>
              {t('contracts.table.columns.status')}
            </th>
            <th className={`${thCell} ${colActions}`} aria-label={t('contracts.table.columns.actions')} />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr className={emptyRow}>
              <td colSpan={11} className={emptyCell}>
                {t('contracts.list.empty')}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => renderRow(row, index))
          )}
        </tbody>
      </table>
    </div>
  )
}
