/**
 * Binding "Buscar / Criar vários" (US3) — ADAPTER React. Multi-seleção de títulos Pago, soma vs valor do
 * extrato e classificação da diferença (Juros/Multa/Desconto/Tarifa/Parcial) para conciliação N:1 ou
 * parcial. Gating do botão pela regra PURA `canReconcileMulti` (a UI nunca envia desbalanceado). Submete
 * via `createReconciliation` e invalida as queries. Erros → tag i18n.
 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import { reconciliationErrorTag } from '#modules/financial/client/data/helpers/reconciliation-error-tag.ts'
import {
  canReconcileMulti,
  deriveReconType,
  filterPayables,
  parseCents,
  payableTypeOptions,
  residualCents,
  sumCentsOf,
  type DifferenceTreatment,
  type PaidPayable,
  type ReconType,
  type StatementTransaction,
} from './reconciliation-workspace.view-model.ts'

export type SearchCreateBinding = Readonly<{
  selectedIds: ReadonlySet<string>
  treatment: DifferenceTreatment | null
  selectedSumCents: number
  residualCents: number
  canReconcile: boolean
  reconType: ReconType
  submitting: boolean
  errorTag: string | null
  // filtros (busca textual + Tipo/categoria — viabiliza achar/selecionar impostos retidos)
  search: string
  typeBucket: string // 'all' | <bucket de categoria>
  typeOptions: readonly string[]
  filtered: readonly PaidPayable[]
  totalCount: number
  setSearch: (v: string) => void
  setTypeBucket: (v: string) => void
  toggle: (payableId: string) => void
  setTreatment: (treatment: DifferenceTreatment) => void
  clear: () => void
  submit: () => void
}>

export function useSearchCreate(
  selectedTx: StatementTransaction | null,
  payables: readonly PaidPayable[],
  onReconciled: (transactionId: string, reconciliationId: string) => void,
): SearchCreateBinding {
  const qc = useQueryClient()
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set())
  const [treatment, setTreatment] = useState<DifferenceTreatment | null>(null)
  const [errorTag, setErrorTag] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeBucket, setTypeBucket] = useState('all')

  const typeOptions = payableTypeOptions(payables)
  const filtered = filterPayables(payables, search, typeBucket)

  const selected = payables.filter((p) => selectedIds.has(p.id))
  const selectedSumCents = sumCentsOf(selected)
  const txValue = selectedTx === null ? 0 : parseCents(selectedTx.valueCents)
  const residual = residualCents(txValue, selectedSumCents)
  const canReconcile = canReconcileMulti(selectedIds.size, residual, treatment !== null)
  const reconType = deriveReconType(selectedIds.size, residual !== 0)

  const mut = useMutation({
    mutationFn: (v: {
      transactionId: string
      payableIds: readonly string[]
      difference?: { valueCents: number; treatment: DifferenceTreatment }
    }) => reconciliationRepository.createReconciliation(v),
    onSuccess: (res, v) => {
      if (res.ok) {
        setErrorTag(null)
        setSelectedIds(new Set())
        setTreatment(null)
        void qc.invalidateQueries({ queryKey: ['financial', 'reconciliation', 'transactions'] })
        onReconciled(v.transactionId, res.value.reconciliationId)
      } else {
        setErrorTag(reconciliationErrorTag(res.error))
      }
    },
  })

  return {
    selectedIds,
    treatment,
    selectedSumCents,
    residualCents: residual,
    canReconcile,
    reconType,
    submitting: mut.isPending,
    errorTag,
    search,
    typeBucket,
    typeOptions,
    filtered,
    totalCount: payables.length,
    setSearch: (v) => {
      setSearch(v)
    },
    setTypeBucket: (v) => {
      setTypeBucket(v)
    },
    toggle: (payableId) => {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (next.has(payableId)) next.delete(payableId)
        else next.add(payableId)
        return next
      })
    },
    setTreatment: (tr) => {
      setTreatment(tr)
    },
    clear: () => {
      setSelectedIds(new Set())
      setTreatment(null)
    },
    submit: () => {
      if (selectedTx === null || !canReconcile) return
      mut.mutate({
        transactionId: selectedTx.id,
        payableIds: [...selectedIds],
        difference: residual !== 0 && treatment !== null ? { valueCents: residual, treatment } : undefined,
      })
    },
  }
}
