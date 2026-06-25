/**
 * Binding "Fechar período" (US7) — ADAPTER React. Fecha o período do extrato importado (usa o período
 * devolvido pela importação como janela). Bloqueado se houver movimentações pendentes (gating na UI +
 * o backend revalida 422 period-has-pending-transactions). Invalida as transações E os períodos (#173,
 * p/ o Exportar habilitar sem reload). Erros → tag i18n.
 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import { reconciliationErrorTag } from '#modules/financial/client/data/helpers/reconciliation-error-tag.ts'
import type { StatementPeriod } from '#modules/financial/client/data/model/reconciliation.model.ts'

export type ClosePeriodBinding = Readonly<{
  canClose: boolean
  closing: boolean
  closed: boolean
  /** O período selecionado JÁ está fechado no backend (não é só desta sessão). */
  alreadyClosed: boolean
  errorTag: string | null
  close: () => void
}>

export function useClosePeriod(
  accountRef: string,
  period: StatementPeriod | null,
  hasPending: boolean,
  // O período do intervalo selecionado já existe fechado no backend (evita re-fechar → erro de chave única).
  alreadyClosed: boolean,
): ClosePeriodBinding {
  const qc = useQueryClient()
  const [closedThisSession, setClosedThisSession] = useState(false)
  const [errorTag, setErrorTag] = useState<string | null>(null)
  const closed = closedThisSession || alreadyClosed

  const mut = useMutation({
    mutationFn: (v: { debitAccountRef: string; periodStart: string; periodEnd: string }) =>
      reconciliationRepository.closePeriod(v),
    onSuccess: (res) => {
      if (res.ok) {
        setErrorTag(null)
        setClosedThisSession(true)
        void qc.invalidateQueries({ queryKey: ['financial', 'reconciliation', 'transactions'] })
        // Fechar cria/sela o período → o Exportar (#173) precisa relê-los p/ habilitar sem reload.
        void qc.invalidateQueries({ queryKey: ['financial', 'reconciliation', 'periods'] })
      } else {
        setErrorTag(reconciliationErrorTag(res.error))
      }
    },
  })

  const canClose = period !== null && !hasPending && !closed && !mut.isPending

  return {
    canClose,
    closing: mut.isPending,
    closed,
    alreadyClosed,
    errorTag,
    close: () => {
      if (period === null || hasPending || closed) return
      mut.mutate({ debitAccountRef: accountRef, periodStart: period.start, periodEnd: period.end })
    },
  }
}
