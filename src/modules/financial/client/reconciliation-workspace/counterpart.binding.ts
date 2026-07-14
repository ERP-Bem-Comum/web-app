/**
 * Binding da contrapartida esperada (US2 do #269) — ADAPTER React. `useCounterpart` deriva a união
 * discriminada §IV do painel (idle|loading|error|none|ready) a partir do GET counterpart-suggestions da
 * transação selecionada; `useConfirmCounterpart` concilia a transação contra a contrapartida e invalida o
 * namespace de conciliação (lista/período/saldo/sugestões seguem o mesmo prefixo). Erros → tag i18n (§V).
 * Espelha `reconcile.binding.ts`.
 */
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import { reconciliationErrorTag } from '#modules/financial/client/data/helpers/reconciliation-error-tag.ts'
import type { ConfirmCounterpartResult } from '#modules/financial/client/data/model/reconciliation.model.ts'
import { counterpartSuggestionsQueryOptions } from './reconciliation-workspace.query.ts'
import { toCounterpartRows, type CounterpartRow } from './counterpart.view-model.ts'

export type CounterpartState =
  | Readonly<{ tag: 'idle' }> // nenhuma transação selecionada (ou não-pendente)
  | Readonly<{ tag: 'loading' }>
  | Readonly<{ tag: 'error'; errorTag: string }>
  | Readonly<{ tag: 'none' }> // sem contrapartida candidata (transação comum de título)
  | Readonly<{ tag: 'ready'; rows: readonly CounterpartRow[] }>

export type ConfirmCounterpartBinding = Readonly<{
  confirming: boolean
  errorTag: string | null
  confirm: (transactionId: string, counterpartId: string) => void
}>

export function useConfirmCounterpart(
  onConfirmed?: (transactionId: string, res: ConfirmCounterpartResult) => void,
): ConfirmCounterpartBinding {
  const qc = useQueryClient()
  const [errorTag, setErrorTag] = useState<string | null>(null)

  const mut = useMutation({
    mutationFn: (v: { transactionId: string; counterpartId: string }) =>
      reconciliationRepository.confirmCounterpart(v),
    onSuccess: (res, v) => {
      if (res.ok) {
        setErrorTag(null)
        // Conciliar a contrapartida muda a lista (movimentos do período #205), os contadores e o status →
        // invalida o namespace inteiro (lista/período/saldo/sugestões compartilham o prefixo).
        void qc.invalidateQueries({ queryKey: ['financial', 'reconciliation'] })
        onConfirmed?.(v.transactionId, res.value)
      } else {
        setErrorTag(reconciliationErrorTag(res.error))
      }
    },
  })

  return {
    confirming: mut.isPending,
    errorTag,
    confirm: (transactionId, counterpartId) => {
      mut.mutate({ transactionId, counterpartId })
    },
  }
}

export type CounterpartBinding = Readonly<{
  state: CounterpartState
  confirming: boolean
  errorTag: string | null
  confirm: (counterpartId: string) => void
}>

export function useCounterpart(
  transactionId: string | null,
  onConfirmed?: (transactionId: string, res: ConfirmCounterpartResult) => void,
): CounterpartBinding {
  const query = useQuery(counterpartSuggestionsQueryOptions(transactionId))
  const confirmBinding = useConfirmCounterpart(onConfirmed)

  const state: CounterpartState = (() => {
    if (transactionId === null) return { tag: 'idle' }
    if (query.isLoading) return { tag: 'loading' }
    if (query.data?.ok === false) return { tag: 'error', errorTag: reconciliationErrorTag(query.data.error) }
    const list = query.data?.ok === true ? query.data.value : []
    if (list.length === 0) return { tag: 'none' }
    return { tag: 'ready', rows: toCounterpartRows(list) }
  })()

  return {
    state,
    confirming: confirmBinding.confirming,
    errorTag: confirmBinding.errorTag,
    confirm: (counterpartId) => {
      if (transactionId !== null) confirmBinding.confirm(transactionId, counterpartId)
    },
  }
}
