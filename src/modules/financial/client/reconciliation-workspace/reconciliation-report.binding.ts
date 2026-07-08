/**
 * useReconciliationReport — ADAPTER React do Relatório da Conciliação (#144). Roda o read do período (#205,
 * `accountStatementPeriodQueryOptions`) e resolve o rótulo da conta (via `useAccountSelector`; fallback ao
 * `accountId` enquanto core-api#168 não expõe o cadastro — chrome honesto). Deriva o `ReportViewState` pela
 * view-model PURA + a identificação da conta COM NÚMERO (`formatAccountNumber`). A view é burra: só consome
 * `{ state, accountLabel, accountNumber }`. Sem `from`/`to` → `no-period`.
 */
import { useQuery } from '@tanstack/react-query'

import { reconciliationErrorTag } from '#modules/financial/client/data/helpers/reconciliation-error-tag.ts'
import { accountStatementPeriodQueryOptions } from './reconciliation-workspace.query.ts'
import { useAccountSelector } from './account-selector.binding.ts'
import {
  buildReconciliationReport,
  formatAccountNumber,
  type ReportViewState,
} from './reconciliation-report.view-model.ts'

export type ReconciliationReportBinding = Readonly<{
  state: ReportViewState
  accountLabel: string
  accountNumber: string
}>

export function useReconciliationReport(
  accountId: string,
  from: string,
  to: string,
): ReconciliationReportBinding {
  // Período resolvido só com ambas as datas; senão a query fica desabilitada e a tela cai em `no-period`.
  const hasPeriod = from !== '' && to !== ''
  const range = hasPeriod ? { from, to } : null
  const periodQuery = useQuery(accountStatementPeriodQueryOptions(accountId, range))
  const { account } = useAccountSelector(accountId)
  const accountLabel = account?.alias ?? accountId
  // Identificação COM NÚMERO (banco · Ag · C/C) para o cabeçalho impresso; vazia até core-api#168 (a view omite).
  const accountNumber = formatAccountNumber(account)

  const state: ReportViewState = (() => {
    if (!hasPeriod) return { tag: 'no-period' }
    if (periodQuery.isLoading) return { tag: 'loading' }
    if (periodQuery.data?.ok === false)
      return { tag: 'error', errorTag: reconciliationErrorTag(periodQuery.data.error) }
    const period = periodQuery.data?.ok === true ? periodQuery.data.value : null
    return { tag: 'ready', report: buildReconciliationReport(period, from, to) }
  })()

  return { state, accountLabel, accountNumber }
}
