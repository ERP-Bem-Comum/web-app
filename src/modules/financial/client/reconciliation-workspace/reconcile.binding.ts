/**
 * Binding de conciliação por sugestão (US1) — ADAPTER React. Conciliar 1:1 e rejeitar sugestão, com
 * invalidação das queries afetadas (transações + sugestões) e trilha local de rejeitadas (a sugestão
 * rejeitada não reaparece — o backend também persiste a rejeição). Erros → tag i18n.
 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import { reconciliationErrorTag } from '#modules/financial/client/data/helpers/reconciliation-error-tag.ts'
import type { ReclassificationInput } from '#modules/financial/client/data/model/reconciliation.model.ts'

const key = (transactionId: string, payableId: string): string => `${transactionId}:${payableId}`

export type ReconcileBinding = Readonly<{
  reconciling: boolean
  rejecting: boolean
  errorTag: string | null
  isRejected: (transactionId: string, payableId: string) => boolean
  /** M2: `reclassification` só vai quando o operador editou a taxonomia (specs/110). */
  reconcileOne: (transactionId: string, payableId: string, reclassification?: ReclassificationInput) => void
  rejectOne: (transactionId: string, payableId: string) => void
}>

export function useReconcile(
  onReconciled: (transactionId: string, reconciliationId: string) => void,
): ReconcileBinding {
  const qc = useQueryClient()
  const [rejected, setRejected] = useState<ReadonlySet<string>>(() => new Set())
  const [errorTag, setErrorTag] = useState<string | null>(null)

  const invalidate = () => {
    // Conciliar muda a lista (movimentos do período #205), as sugestões e os contadores das abas →
    // invalida o namespace inteiro p/ Extrato e Conciliação refletirem o novo status juntos.
    void qc.invalidateQueries({ queryKey: ['financial', 'reconciliation'] })
  }

  const reconcileMut = useMutation({
    mutationFn: (v: { transactionId: string; payableId: string; reclassification?: ReclassificationInput }) =>
      reconciliationRepository.createReconciliation({
        transactionId: v.transactionId,
        payableIds: [v.payableId],
        // M2: ausente = conciliar sem mexer na classificação (RN-M2-03 — vale a do lançamento).
        reclassification: v.reclassification,
      }),
    onSuccess: (res, v) => {
      if (res.ok) {
        setErrorTag(null)
        invalidate()
        onReconciled(v.transactionId, res.value.reconciliationId)
      } else {
        setErrorTag(reconciliationErrorTag(res.error))
      }
    },
  })

  const rejectMut = useMutation({
    mutationFn: (v: { transactionId: string; payableId: string }) =>
      reconciliationRepository.rejectSuggestion(v),
    onSuccess: (res, v) => {
      if (res.ok) {
        setErrorTag(null)
        setRejected((prev) => new Set(prev).add(key(v.transactionId, v.payableId)))
        void qc.invalidateQueries({ queryKey: ['financial', 'reconciliation', 'suggestions'] })
      } else {
        setErrorTag(reconciliationErrorTag(res.error))
      }
    },
  })

  return {
    reconciling: reconcileMut.isPending,
    rejecting: rejectMut.isPending,
    errorTag,
    isRejected: (transactionId, payableId) => rejected.has(key(transactionId, payableId)),
    reconcileOne: (transactionId, payableId, reclassification) => {
      reconcileMut.mutate({ transactionId, payableId, reclassification })
    },
    rejectOne: (transactionId, payableId) => {
      rejectMut.mutate({ transactionId, payableId })
    },
  }
}
