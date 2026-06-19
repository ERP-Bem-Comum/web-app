/**
 * View-model do grid de contas-cedente (TELA 1) — derivação PURA (§XI; sem React). Mapeia
 * `ReconciliationAccount[]` → linhas da tela + filtros (busca/status), ordenação e consolidado. Os dados
 * reais dependem de core-api#168; até lá o binding entrega `unavailable` (estado honesto, sem fabricar).
 * Espelha `contas-a-pagar.view-model.ts`.
 */
import { centsToBRL } from '#modules/financial/client/data/money.ts'
import type { ReconciliationAccount } from '#modules/financial/client/data/model/reconciliation.model.ts'

export { centsToBRL } from '#modules/financial/client/data/money.ts'
export type { ReconciliationAccount } from '#modules/financial/client/data/model/reconciliation.model.ts'

export type AccountStatusKind = 'pending' | 'up-to-date' | 'closed'
export type StatusFilter = 'todas' | 'pendentes' | 'em-dia' | 'encerradas'
export type SortKey = 'pendencias' | 'saldo' | 'nome' | 'atualizacao'

export type AccountRow = Readonly<{
  id: string
  bankCode: string
  bankName: string
  alias: string
  branch: string
  accountNumber: string
  accountDv: string
  balanceBRL: string
  lastUpdatedAt: string
  pendingCount: number
  status: AccountStatusKind
  openable: boolean // encerrada não abre o workspace
}>

/** Situação de conciliação da conta (encerrada > pendências > em dia). */
export const accountStatus = (a: ReconciliationAccount): AccountStatusKind => {
  if (a.status === 'Closed') return 'closed'
  return a.pendingCount > 0 ? 'pending' : 'up-to-date'
}

export const toAccountRow = (a: ReconciliationAccount): AccountRow => {
  const status = accountStatus(a)
  return {
    id: a.id,
    bankCode: a.bankCode,
    bankName: a.bankName,
    alias: a.alias,
    branch: a.branch,
    accountNumber: a.accountNumber,
    accountDv: a.accountDv,
    balanceBRL: centsToBRL(a.currentBalanceCents),
    lastUpdatedAt: a.lastUpdatedAt,
    pendingCount: a.pendingCount,
    status,
    openable: status !== 'closed',
  }
}

const matchesSearch = (a: ReconciliationAccount, q: string): boolean => {
  const needle = q.trim().toLowerCase()
  if (needle === '') return true
  return [a.bankName, a.bankCode, a.branch, a.accountNumber, a.alias].join(' ').toLowerCase().includes(needle)
}

const matchesStatus = (a: ReconciliationAccount, filter: StatusFilter): boolean => {
  switch (filter) {
    case 'todas':
      return true
    case 'pendentes':
      return accountStatus(a) === 'pending'
    case 'em-dia':
      return accountStatus(a) === 'up-to-date'
    case 'encerradas':
      return accountStatus(a) === 'closed'
    default: {
      const _exhaustive: never = filter
      return _exhaustive
    }
  }
}

const parseCents = (s: string): number => {
  const n = Number.parseInt(s, 10)
  return Number.isFinite(n) ? n : 0
}

const compareBy =
  (key: SortKey) =>
  (a: ReconciliationAccount, b: ReconciliationAccount): number => {
    switch (key) {
      case 'pendencias':
        return b.pendingCount - a.pendingCount
      case 'saldo':
        return parseCents(b.currentBalanceCents) - parseCents(a.currentBalanceCents)
      case 'nome':
        return a.alias.localeCompare(b.alias, 'pt-BR')
      case 'atualizacao':
        return b.lastUpdatedAt.localeCompare(a.lastUpdatedAt)
      default: {
        const _exhaustive: never = key
        return _exhaustive
      }
    }
  }

/** Aplica busca + filtro de status + ordenação e mapeia para linhas. */
export const deriveAccountRows = (
  accounts: readonly ReconciliationAccount[],
  opts: Readonly<{ search: string; status: StatusFilter; sort: SortKey }>,
): readonly AccountRow[] =>
  accounts
    .filter((a) => matchesSearch(a, opts.search) && matchesStatus(a, opts.status))
    .slice()
    .sort(compareBy(opts.sort))
    .map(toAccountRow)

export type Consolidated = Readonly<{ balanceBRL: string; accountsCount: number; pendingTotal: number }>

/** Saldo consolidado + nº de contas + total de pendências (sobre o conjunto filtrado). */
export const consolidate = (accounts: readonly ReconciliationAccount[]): Consolidated => ({
  balanceBRL: centsToBRL(accounts.reduce((acc, a) => acc + parseCents(a.currentBalanceCents), 0)),
  accountsCount: accounts.length,
  pendingTotal: accounts.reduce((acc, a) => acc + a.pendingCount, 0),
})

export type AccountsState =
  | Readonly<{ tag: 'loading' }>
  | Readonly<{ tag: 'unavailable' }> // #168: sem endpoint — chrome honesto
  | Readonly<{ tag: 'error'; errorTag: string }>
  | Readonly<{ tag: 'empty' }>
  | Readonly<{ tag: 'ready'; rows: readonly AccountRow[]; consolidated: Consolidated }>
