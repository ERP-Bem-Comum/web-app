/**
 * Binding "Reabrir período" (#203) — ADAPTER React. Lista os períodos da conta, escolhe o MAIS RECENTE e,
 * se estiver FECHADO, permite reabri-lo (Closed → Open) via POST /reconciliation-periods/:id/reopen.
 * Invalida transações E períodos (p/ o footer voltar a permitir Fechar e o Exportar refletir o estado).
 * Sem período fechado → desabilitado (honesto). Erros → tag i18n.
 */
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import { reconciliationErrorTag } from '#modules/financial/client/data/helpers/reconciliation-error-tag.ts'
import { reconciliationPeriodsQueryOptions } from './reconciliation-workspace.query.ts'
import { pickLatestPeriod } from './reconciliation-workspace.view-model.ts'

export type ReopenPeriodBinding = Readonly<{
  canReopen: boolean
  reopening: boolean
  errorTag: string | null
  reopen: () => void
}>

export function useReopenPeriod(debitAccountRef: string | null, onDone: () => void): ReopenPeriodBinding {
  const qc = useQueryClient()
  const periodsQuery = useQuery(reconciliationPeriodsQueryOptions(debitAccountRef))
  const periods = periodsQuery.data?.ok === true ? periodsQuery.data.value : []
  const latest = pickLatestPeriod(periods)
  const [errorTag, setErrorTag] = useState<string | null>(null)

  const mut = useMutation({
    mutationFn: (v: { periodId: string }) => reconciliationRepository.reopenPeriod(v),
    onSuccess: (res) => {
      if (res.ok) {
        setErrorTag(null)
        void qc.invalidateQueries({ queryKey: ['financial', 'reconciliation', 'transactions'] })
        void qc.invalidateQueries({ queryKey: ['financial', 'reconciliation', 'periods'] })
        onDone()
      } else {
        setErrorTag(reconciliationErrorTag(res.error))
      }
    },
  })

  // Só reabre o período mais recente quando ele está FECHADO.
  const canReopen = latest !== null && latest.status === 'Closed' && !mut.isPending

  return {
    canReopen,
    reopening: mut.isPending,
    errorTag,
    reopen: () => {
      if (latest?.status !== 'Closed') return
      mut.mutate({ periodId: latest.id })
    },
  }
}
