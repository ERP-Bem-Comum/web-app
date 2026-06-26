/**
 * usePatternBatch — ADAPTER React p/ a conciliação em LOTE por padrão (US5). Aplica UM template de
 * lançamento manual a N transações selecionadas (rota `POST /reconciliations/batch`). O lote do backend
 * suporta só tipos SEM destino (Tarifa/Pagamento/Recebimento) — ver `isBatchableManualType`. Sucesso →
 * invalida o namespace (lista do período + contadores). Erros → tag i18n.
 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import { reconciliationErrorTag } from '#modules/financial/client/data/helpers/reconciliation-error-tag.ts'
import type {
  BatchReconcileInput,
  ManualEntryTemplate,
} from '#modules/financial/client/data/model/reconciliation.model.ts'

export type PatternBatchBinding = Readonly<{
  applying: boolean
  errorTag: string | null
  apply: (transactionIds: readonly string[], template: ManualEntryTemplate) => void
}>

export function usePatternBatch(onApplied: () => void): PatternBatchBinding {
  const qc = useQueryClient()
  const [errorTag, setErrorTag] = useState<string | null>(null)

  const mut = useMutation({
    mutationFn: (v: BatchReconcileInput) => reconciliationRepository.batchReconcile(v),
    onSuccess: (res) => {
      if (res.ok) {
        setErrorTag(null)
        void qc.invalidateQueries({ queryKey: ['financial', 'reconciliation'] })
        onApplied()
      } else {
        setErrorTag(reconciliationErrorTag(res.error))
      }
    },
  })

  return {
    applying: mut.isPending,
    errorTag,
    apply: (transactionIds, template) => {
      if (transactionIds.length === 0) return
      mut.mutate({ transactionIds: [...transactionIds], template })
    },
  }
}
