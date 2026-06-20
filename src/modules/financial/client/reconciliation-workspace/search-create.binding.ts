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
  /** Habilita o botão Conciliar: revela o tratamento (se há diferença) OU submete (se balanceado/classificado). */
  canConfirm: boolean
  /** Painel de tratamento da diferença visível — só DEPOIS de clicar Conciliar com diferença (fiel ao mock §9.4.6). */
  showTreatment: boolean
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
  /** Ação do botão Conciliar: 1º clique com diferença → revela o tratamento; depois classifica → submete. */
  confirm: () => void
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
  // #9.4.6: o tratamento da diferença só aparece DEPOIS de clicar Conciliar com diferença (não na hora
  // que a soma diverge). Reposto a cada mudança de seleção / clear / sucesso.
  const [revealTreatment, setRevealTreatment] = useState(false)

  const typeOptions = payableTypeOptions(payables)
  const filtered = filterPayables(payables, search, typeBucket)

  const selected = payables.filter((p) => selectedIds.has(p.id))
  const selectedSumCents = sumCentsOf(selected)
  const txValue = selectedTx === null ? 0 : parseCents(selectedTx.valueCents)
  const residual = residualCents(txValue, selectedSumCents)
  const canReconcile = canReconcileMulti(selectedIds.size, residual, treatment !== null)
  const reconType = deriveReconType(selectedIds.size, residual !== 0)
  // Painel de tratamento: só com diferença E depois do 1º clique em Conciliar.
  const showTreatment = revealTreatment && residual !== 0
  // Botão habilitado: balanceado (submete) | diferença ainda não revelada (revela) | já classificado (submete).
  const canConfirm = selectedIds.size > 0 && (residual === 0 || !revealTreatment || treatment !== null)

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
        setRevealTreatment(false)
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
    canConfirm,
    showTreatment,
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
      // Mudar a seleção re-fecha o painel de tratamento: ele só reabre via clique em Conciliar.
      setRevealTreatment(false)
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
      setRevealTreatment(false)
    },
    confirm: () => {
      if (selectedTx === null || selectedIds.size === 0 || mut.isPending) return
      // 1º clique com diferença ainda não revelada → abre o tratamento (não submete).
      if (residual !== 0 && !revealTreatment) {
        setRevealTreatment(true)
        return
      }
      // Balanceado, ou diferença já classificada → submete.
      if (!canReconcile) return
      mut.mutate({
        transactionId: selectedTx.id,
        payableIds: [...selectedIds],
        difference: residual !== 0 && treatment !== null ? { valueCents: residual, treatment } : undefined,
      })
    },
  }
}
