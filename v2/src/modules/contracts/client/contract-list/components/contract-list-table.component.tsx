import type { ReactNode } from 'react'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import type { Contract } from '#modules/contracts/client/data/model/contracts.model.ts'

const t = createTranslator(ptBR)

interface Props {
  contracts: readonly Contract[]
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

function formatPeriod(start: Date, end: Date): string {
  const fmt = (d: Date) => d.toLocaleDateString('pt-BR')
  return `${fmt(start)} — ${fmt(end)}`
}

export function ContractListTable({ contracts }: Props): ReactNode {
  return (
    <table>
      <thead>
        <tr>
          <th>{t('contracts.list.columns.code')}</th>
          <th>{t('contracts.list.columns.title')}</th>
          <th>{t('contracts.list.columns.type')}</th>
          <th>{t('contracts.list.columns.status')}</th>
          <th>{t('contracts.list.columns.originalValue')}</th>
          <th>{t('contracts.list.columns.currentValue')}</th>
          <th>{t('contracts.list.columns.period')}</th>
          <th>{t('contracts.list.columns.balance')}</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        {contracts.map((c) => (
          <tr key={c.id}>
            <td>{c.sequentialNumber}</td>
            <td>{c.title}</td>
            <td>{t(`contracts.type.${c.contractType}`)}</td>
            <td>{t(`contracts.status.${c.status}`)}</td>
            <td>{formatCurrency(c.originalValue.cents)}</td>
            <td>{formatCurrency(c.currentValue.cents)}</td>
            <td>{formatPeriod(c.originalPeriod.start, c.originalPeriod.end)}</td>
            <td>—</td>
            <td>
              <a href={`/contratos/${c.id}`}>{t('contracts.list.actions.view')}</a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
