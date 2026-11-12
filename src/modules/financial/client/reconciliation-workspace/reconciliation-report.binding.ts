/**
 * useReconciliationReport — ADAPTER React do Relatório da Conciliação (#144). Roda o read do período (#205,
 * `accountStatementPeriodQueryOptions`) e resolve o rótulo da conta (via `useAccountSelector`; fallback ao
 * `accountId` enquanto core-api#168 não expõe o cadastro — chrome honesto). Deriva o `ReportViewState` pela
 * view-model PURA + a identificação da conta COM NÚMERO (`formatAccountNumber`). A view é burra: só consome
 * o estado + a identificação da conta + a emissão. Sem `from`/`to` → `no-period`.
 */
import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { useQuery } from '@tanstack/react-query'

import { isOk } from '#shared/primitives/result.ts'
import { myAccountQueryOptions } from '#modules/users/public-api/index.ts'

import { reconciliationErrorTag } from '#modules/financial/client/data/helpers/reconciliation-error-tag.ts'
import { accountStatementPeriodQueryOptions } from './reconciliation-workspace.query.ts'
import { useAccountSelector } from './account-selector.binding.ts'
import {
  buildReconciliationReport,
  formatEmission,
  formatAccountNumber,
  type ReportViewState,
} from './reconciliation-report.view-model.ts'

export type ReconciliationReportBinding = Readonly<{
  state: ReportViewState
  accountLabel: string
  accountNumber: string
  accountDocument: string
  emission: Readonly<{ at: string; userName: string }>
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
  // Nome de quem emite: mesma query do topbar (['users','me']), então não gera rede extra.
  const profile = useQuery(myAccountQueryOptions).data
  const userName = profile !== undefined && isOk(profile) ? profile.value.name : ''
  // Data e hora da EMISSÃO: o bloco fica montado desde a abertura da tela, então o carimbo é tirado no
  // momento de imprimir. `flushSync` porque o navegador congela a página logo após o `beforeprint`.
  const [emittedAt, setEmittedAt] = useState<Date | null>(null)
  useEffect(() => {
    const stamp = (): void => {
      flushSync(() => {
        setEmittedAt(new Date())
      })
    }
    window.addEventListener('beforeprint', stamp)
    return () => {
      window.removeEventListener('beforeprint', stamp)
    }
  }, [])

  const state: ReportViewState = (() => {
    if (!hasPeriod) return { tag: 'no-period' }
    if (periodQuery.isLoading) return { tag: 'loading' }
    if (periodQuery.data?.ok === false)
      return { tag: 'error', errorTag: reconciliationErrorTag(periodQuery.data.error) }
    const period = periodQuery.data?.ok === true ? periodQuery.data.value : null
    return { tag: 'ready', report: buildReconciliationReport(period, from, to) }
  })()

  return {
    state,
    accountLabel,
    accountNumber,
    accountDocument: account?.document ?? '',
    emission: {
      at: emittedAt !== null ? formatEmission(emittedAt) : '',
      userName,
    },
  }
}
