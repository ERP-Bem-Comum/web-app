/**
 * RecentPaymentsWidget — view BURRA (§XI): recebe `{ status, rows }` por props e só apresenta. Card com
 * tabela (Fornecedor · Conta débito · Valor · Data). Estados: loading (skeleton), empty, error e forbidden
 * (nota discreta, sem quebrar o dashboard). ZERO lógica de dados — a formatação vem do view-model puro e o
 * estado do binding. i18n via `createTranslator` (PT); nada hardcoded.
 */
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import type { RecentPaymentsView } from '../recent-payments.binding.ts'
import {
  card,
  title,
  table,
  th,
  thValue,
  row,
  td,
  tdName,
  tdValue,
  note,
  errorNote,
  skeletonRow,
} from './recent-payments-widget.css.ts'

const tDefault = createTranslator(ptBR)

export type RecentPaymentsWidgetProps = RecentPaymentsView & Readonly<{ t?: (key: string) => string }>

export function RecentPaymentsWidget({ status, rows, t = tDefault }: RecentPaymentsWidgetProps) {
  return (
    <section className={card} aria-label={t('dashboard.recent-payments.title')}>
      <h2 className={title}>{t('dashboard.recent-payments.title')}</h2>

      {status === 'loading' && (
        <div aria-hidden>
          <div className={skeletonRow} />
          <div className={skeletonRow} />
          <div className={skeletonRow} />
        </div>
      )}

      {status === 'empty' && <p className={note}>{t('dashboard.recent-payments.empty')}</p>}

      {status === 'error' && (
        <p className={errorNote} role="alert">
          {t('dashboard.recent-payments.error')}
        </p>
      )}

      {status === 'forbidden' && <p className={note}>{t('dashboard.recent-payments.forbidden')}</p>}

      {status === 'ready' && (
        <table className={table}>
          <thead>
            <tr>
              <th className={th}>{t('dashboard.recent-payments.col.supplier')}</th>
              <th className={th}>{t('dashboard.recent-payments.col.paid-at')}</th>
              <th className={th}>{t('dashboard.recent-payments.col.debit-account')}</th>
              <th className={thValue}>{t('dashboard.recent-payments.col.value')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.payableId} className={row}>
                <td className={tdName}>{r.supplier}</td>
                <td className={td}>{r.paidAt}</td>
                <td className={td}>{r.debitAccount}</td>
                <td className={tdValue}>{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
