/**
 * Binding "Desfazer conciliação" (US5) — ADAPTER React. Desfaz uma conciliação (motivo opcional),
 * devolvendo a transação a pendente; o registro fica como desfeito (trilha). Invalida as transações.
 * Erros → tag i18n.
 *
 * O `reconciliationId` vem do mapa de sessão (conciliações feitas agora) OU do lookup #175
 * (`GET /statement-transactions/:id/reconciliation`) — então o Desfazer funciona inclusive após reload.
 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import { reconciliationErrorTag } from '#modules/financial/client/data/helpers/reconciliation-error-tag.ts'

export type UndoBinding = Readonly<{
  reason: string
  undoing: boolean
  errorTag: string | null
  setReason: (v: string) => void
  undo: (reconciliationId: string, transactionId: string) => void
}>

export function useUndo(onUndone: (transactionId: string) => void): UndoBinding {
  const qc = useQueryClient()
  const [reason, setReason] = useState('')
  const [errorTag, setErrorTag] = useState<string | null>(null)

  const mut = useMutation({
    mutationFn: (v: { reconciliationId: string; transactionId: string; reason?: string }) =>
      reconciliationRepository.undoReconciliation({ reconciliationId: v.reconciliationId, reason: v.reason }),
    onSuccess: (res, v) => {
      if (res.ok) {
        setErrorTag(null)
        setReason('')
        // Desfazer volta a transação a Pendente → invalida o namespace (lista do período + contadores).
        void qc.invalidateQueries({ queryKey: ['financial', 'reconciliation'] })
        onUndone(v.transactionId)
      } else {
        setErrorTag(reconciliationErrorTag(res.error))
      }
    },
  })

  return {
    reason,
    undoing: mut.isPending,
    errorTag,
    setReason: (v) => {
      setReason(v)
    },
    undo: (reconciliationId, transactionId) => {
      const r = reason.trim()
      mut.mutate({ reconciliationId, transactionId, reason: r === '' ? undefined : r })
    },
  }
}
