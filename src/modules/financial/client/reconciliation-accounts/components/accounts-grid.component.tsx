/**
 * AccountsGrid (TELA 1) — view burra: cabeçalho + linhas das contas-cedente (bank-mark, conta+meta,
 * última atualização, saldo, pill de conciliação, seta). Recebe as linhas derivadas por props; sem
 * data-hooks. Conta encerrada não abre (linha não-clicável + aviso).
 */
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { CheckCircleIcon, ChevronDownIcon } from '#shared/ui/icons/index.ts'

import * as s from '../page/reconciliation-accounts.css.ts'
import type { AccountRow } from '../reconciliation-accounts.view-model.ts'

const t = createTranslator(ptBR)

export type AccountsGridProps = Readonly<{
  rows: readonly AccountRow[]
  onOpen: (row: AccountRow) => void
}>

function StatusPill({ row }: Readonly<{ row: AccountRow }>) {
  if (row.status === 'closed') {
    return <span className={s.statusPill.closed}>{t('financial.recon.accounts.status.closed')}</span>
  }
  if (row.status === 'pending') {
    return (
      <span className={s.statusPill.pending}>
        <span className={s.pillDot.pending} aria-hidden="true" />
        {t('financial.recon.accounts.status.pending').replace('{n}', String(row.pendingCount))}
      </span>
    )
  }
  return (
    <span className={s.statusPill.upToDate}>
      <CheckCircleIcon />
      {t('financial.recon.accounts.status.upToDate')}
    </span>
  )
}

function Row({ row, onOpen }: Readonly<{ row: AccountRow; onOpen: (row: AccountRow) => void }>) {
  const initials = (row.bankName || row.bankCode).slice(0, 2).toUpperCase()
  const meta = `${row.bankCode} ${row.bankName} · Ag ${row.branch} · CC ${row.accountNumber}-${row.accountDv}`
  return (
    <button
      type="button"
      className={row.openable ? s.gridRow.base : s.gridRow.closed}
      aria-disabled={!row.openable}
      onClick={() => {
        onOpen(row)
      }}
    >
      <span className={s.colConta}>
        <span className={s.bankMark} aria-hidden="true">
          {initials}
        </span>
        <span className={s.contaInfo}>
          <span className={s.contaNome}>{row.alias}</span>
          <span className={s.contaMeta}>{meta}</span>
        </span>
      </span>
      <span className={s.updRel}>{row.lastUpdatedAt}</span>
      <span className={s.saldoCol}>
        <span className={s.saldoVal}>{row.balanceBRL}</span>
        <span className={s.saldoLbl}>{t('financial.recon.accounts.saldoLbl')}</span>
      </span>
      <StatusPill row={row} />
      <span className={s.colArrow} aria-hidden="true">
        <ChevronDownIcon />
      </span>
    </button>
  )
}

export function AccountsGrid({ rows, onOpen }: AccountsGridProps) {
  return (
    <>
      <div className={s.gridHead}>
        <span>{t('financial.recon.accounts.col.conta')}</span>
        <span>{t('financial.recon.accounts.col.upd')}</span>
        <span className={s.gridHeadRight}>{t('financial.recon.accounts.col.saldo')}</span>
        <span>{t('financial.recon.accounts.col.status')}</span>
        <span />
      </div>
      <div className={s.gridBody}>
        {rows.map((row) => (
          <Row key={row.id} row={row} onOpen={onOpen} />
        ))}
      </div>
    </>
  )
}
