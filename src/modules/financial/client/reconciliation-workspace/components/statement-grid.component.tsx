/**
 * Statement-grid (US8) — view burra: aba Extrato. Grid completo das movimentações (data, movimentação,
 * entrada/saída, saldo após) com filtros (Todos/Entradas/Saídas/Conciliados/Pendentes) e totais.
 * Recebe os itens já filtrados + totais por props; sem data-hooks.
 */
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import * as s from '../page/reconciliation-workspace.css.ts'
import {
  centsToBRL,
  type ExtratoFilter,
  type ExtratoTotals,
  type StatementTransaction,
} from '../reconciliation-workspace.view-model.ts'

const t = createTranslator(ptBR)
const DASH = '—' // sem valor na coluna (não é string de UI traduzível)

const FILTERS: readonly { id: ExtratoFilter; tag: string }[] = [
  { id: 'todos', tag: 'financial.recon.ext.filter.todos' },
  { id: 'entradas', tag: 'financial.recon.ext.filter.entradas' },
  { id: 'saidas', tag: 'financial.recon.ext.filter.saidas' },
  { id: 'conciliados', tag: 'financial.recon.ext.filter.conciliados' },
  { id: 'pendentes', tag: 'financial.recon.ext.filter.pendentes' },
]

export type StatementGridProps = Readonly<{
  hasStatement: boolean
  items: readonly StatementTransaction[]
  totals: ExtratoTotals
  filter: ExtratoFilter
  onFilter: (filter: ExtratoFilter) => void
}>

export function StatementGrid({ hasStatement, items, totals, filter, onFilter }: StatementGridProps) {
  if (!hasStatement) {
    return <div className={s.emptyState}>{t('financial.recon.ext.idle')}</div>
  }
  return (
    <div className={s.extWrap}>
      <div className={s.extHead}>
        <div className={s.filterTabs} role="group" aria-label={t('financial.recon.tab.extrato')}>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={filter === f.id ? s.filterTab.active : s.filterTab.inactive}
              aria-pressed={filter === f.id}
              onClick={() => {
                onFilter(f.id)
              }}
            >
              {t(f.tag)}
            </button>
          ))}
        </div>
      </div>

      <div className={s.extHeadRow}>
        <span>{t('financial.recon.ext.col.date')}</span>
        <span>{t('financial.recon.ext.col.name')}</span>
        <span className={s.extCellMonoRight}>{t('financial.recon.ext.col.in')}</span>
        <span className={s.extCellMonoRight}>{t('financial.recon.ext.col.out')}</span>
        <span className={s.extCellMonoRight}>{t('financial.recon.ext.col.balance')}</span>
      </div>

      <div className={s.extRows}>
        {items.length === 0 ? (
          <p className={s.emptyState}>{t('financial.recon.ext.empty')}</p>
        ) : (
          items.map((tx) => (
            <div key={tx.id} className={s.extRow}>
              <span className={s.extCellMono}>{tx.date}</span>
              <span className={s.extName}>{tx.payeeName}</span>
              <span className={s.extIn}>{tx.movement === 'Credit' ? centsToBRL(tx.valueCents) : DASH}</span>
              <span className={s.extOut}>{tx.movement === 'Debit' ? centsToBRL(tx.valueCents) : DASH}</span>
              <span className={s.extCellMonoRight}>{centsToBRL(tx.balanceAfterCents)}</span>
            </div>
          ))
        )}
      </div>

      <div className={s.extFoot}>
        <span />
        <span>{t('financial.recon.ext.totals')}</span>
        <span className={s.extIn}>{centsToBRL(totals.inCents)}</span>
        <span className={s.extOut}>{centsToBRL(totals.outCents)}</span>
        <span />
      </div>
    </div>
  )
}
