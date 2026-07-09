/**
 * Binding "Buscar / Criar vários" (US3) — ADAPTER React. Multi-seleção de títulos Pago, soma vs valor do
 * extrato e classificação da diferença (Juros/Multa/Desconto/Tarifa/Parcial) para conciliação N:1 ou
 * parcial. Gating do botão pela regra PURA `canReconcileMulti` (a UI nunca envia desbalanceado). Submete
 * via `createReconciliation` e invalida as queries. Erros → tag i18n.
 */
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import { reconciliationErrorTag } from '#modules/financial/client/data/helpers/reconciliation-error-tag.ts'
import { referencesQueryOptions } from './reconciliation-workspace.query.ts'
import {
  canReconcileMulti,
  centsToAmountInput,
  deriveReconType,
  filterPayables,
  INITIAL_MULTI_FILTER,
  parseBRLToCents,
  parseCents,
  RECON_DOCUMENT_TYPE_OPTIONS,
  residualCents,
  sumCentsOf,
  type DifferenceTreatment,
  type MultiFilter,
  type PaidPayable,
  type PeriodField,
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
  // Tratamento da diferença: centro de custo (opções reais) + observação (texto livre).
  costCenterRef: string
  observation: string
  costCenterOptions: readonly { value: string; label: string }[]
  setCostCenterRef: (v: string) => void
  setObservation: (v: string) => void
  // ── Filtros RICOS (056) — client-side sobre a lista carregada ──
  // Busca textual.
  search: string
  setSearch: (v: string) => void
  // Tipo (documento/imposto retido) — lista CANÔNICA; 'all' = todos.
  documentType: string
  typeOptions: readonly string[]
  setDocumentType: (v: string) => void
  // Período (popover): toggle Vencimento/Emissão + intervalo De/Até (calendário nativo). Draft → Aplicar.
  periodOpen: boolean
  togglePeriod: () => void
  closePeriod: () => void
  periodField: PeriodField // aplicado
  periodFrom: string // aplicado (YYYY-MM-DD)
  periodTo: string // aplicado (YYYY-MM-DD)
  periodActive: boolean // há intervalo aplicado
  periodFieldDraft: PeriodField
  periodFromDraft: string
  periodToDraft: string
  setPeriodFieldDraft: (f: PeriodField) => void
  setPeriodFromDraft: (v: string) => void
  setPeriodToDraft: (v: string) => void
  applyPeriod: () => void
  clearPeriod: () => void
  // Valor (popover): intervalo Mínimo/Máximo em R$ (texto PT). Draft → Aplicar.
  valueOpen: boolean
  toggleValue: () => void
  closeValue: () => void
  valueActive: boolean // há mínimo ou máximo aplicado
  valueMinDraft: string
  valueMaxDraft: string
  setValueMinDraft: (v: string) => void
  setValueMaxDraft: (v: string) => void
  applyValue: () => void
  clearValue: () => void
  // Resultado.
  filtered: readonly PaidPayable[]
  totalCount: number
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
  const [documentType, setDocumentType] = useState(INITIAL_MULTI_FILTER.documentType)
  // Período (aplicado) + rascunho do popover (só vira aplicado no "Aplicar").
  const [periodOpen, setPeriodOpen] = useState(false)
  const [periodField, setPeriodField] = useState<PeriodField>(INITIAL_MULTI_FILTER.period.field)
  const [periodFrom, setPeriodFrom] = useState('')
  const [periodTo, setPeriodTo] = useState('')
  const [periodFieldDraft, setPeriodFieldDraft] = useState<PeriodField>(INITIAL_MULTI_FILTER.period.field)
  const [periodFromDraft, setPeriodFromDraft] = useState('')
  const [periodToDraft, setPeriodToDraft] = useState('')
  // Valor (aplicado, em centavos) + rascunho do popover (texto R$ PT).
  const [valueOpen, setValueOpen] = useState(false)
  const [valueMinCents, setValueMinCents] = useState<number | null>(null)
  const [valueMaxCents, setValueMaxCents] = useState<number | null>(null)
  const [valueMinDraft, setValueMinDraft] = useState('')
  const [valueMaxDraft, setValueMaxDraft] = useState('')
  // #9.4.6: o tratamento da diferença só aparece DEPOIS de clicar Conciliar com diferença (não na hora
  // que a soma diverge). Reposto a cada mudança de seleção / clear / sucesso.
  const [revealTreatment, setRevealTreatment] = useState(false)
  const [costCenterRef, setCostCenterRef] = useState('')
  const [observation, setObservation] = useState('')

  // Centro de custo da diferença (020 · #200): a query devolve um Result → desembrulha p/ as opções reais.
  const referencesResult = useQuery(referencesQueryOptions()).data
  const references = referencesResult?.ok === true ? referencesResult.value : null
  const costCenterOptions: readonly { value: string; label: string }[] =
    references?.costCenters.map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` })) ?? []

  const periodActive = periodFrom !== '' || periodTo !== ''
  const valueActive = valueMinCents !== null || valueMaxCents !== null
  const filter: MultiFilter = {
    search,
    documentType,
    period: { field: periodField, from: periodFrom, to: periodTo },
    value: { minCents: valueMinCents, maxCents: valueMaxCents },
  }
  const filtered = filterPayables(payables, filter)

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
      difference?: {
        valueCents: number
        treatment: DifferenceTreatment
        costCenterRef?: string
        note?: string
      }
    }) => reconciliationRepository.createReconciliation(v),
    onSuccess: (res, v) => {
      if (res.ok) {
        setErrorTag(null)
        setSelectedIds(new Set())
        setTreatment(null)
        setRevealTreatment(false)
        setCostCenterRef('')
        setObservation('')
        // Conciliar muda a lista do período + contadores das duas abas → invalida o namespace.
        void qc.invalidateQueries({ queryKey: ['financial', 'reconciliation'] })
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
    costCenterRef,
    observation,
    costCenterOptions,
    setCostCenterRef: (v) => {
      setCostCenterRef(v)
    },
    setObservation: (v) => {
      setObservation(v)
    },
    search,
    setSearch: (v) => {
      setSearch(v)
    },
    documentType,
    typeOptions: RECON_DOCUMENT_TYPE_OPTIONS,
    setDocumentType: (v) => {
      setDocumentType(v)
    },
    periodOpen,
    togglePeriod: () => {
      // Abrir sincroniza o rascunho com o aplicado (edita a partir do estado atual); fechar Valor.
      setPeriodOpen((o) => {
        if (!o) {
          setPeriodFieldDraft(periodField)
          setPeriodFromDraft(periodFrom)
          setPeriodToDraft(periodTo)
          setValueOpen(false)
        }
        return !o
      })
    },
    closePeriod: () => {
      setPeriodOpen(false)
    },
    periodField,
    periodFrom,
    periodTo,
    periodActive,
    periodFieldDraft,
    periodFromDraft,
    periodToDraft,
    setPeriodFieldDraft: (f) => {
      setPeriodFieldDraft(f)
    },
    setPeriodFromDraft: (v) => {
      setPeriodFromDraft(v)
    },
    setPeriodToDraft: (v) => {
      setPeriodToDraft(v)
    },
    applyPeriod: () => {
      setPeriodField(periodFieldDraft)
      setPeriodFrom(periodFromDraft)
      setPeriodTo(periodToDraft)
      setPeriodOpen(false)
    },
    clearPeriod: () => {
      setPeriodField(INITIAL_MULTI_FILTER.period.field)
      setPeriodFrom('')
      setPeriodTo('')
      setPeriodFieldDraft(INITIAL_MULTI_FILTER.period.field)
      setPeriodFromDraft('')
      setPeriodToDraft('')
    },
    valueOpen,
    toggleValue: () => {
      setValueOpen((o) => {
        if (!o) {
          setValueMinDraft(valueMinCents === null ? '' : centsToAmountInput(valueMinCents))
          setValueMaxDraft(valueMaxCents === null ? '' : centsToAmountInput(valueMaxCents))
          setPeriodOpen(false)
        }
        return !o
      })
    },
    closeValue: () => {
      setValueOpen(false)
    },
    valueActive,
    valueMinDraft,
    valueMaxDraft,
    setValueMinDraft: (v) => {
      setValueMinDraft(v)
    },
    setValueMaxDraft: (v) => {
      setValueMaxDraft(v)
    },
    applyValue: () => {
      setValueMinCents(parseBRLToCents(valueMinDraft))
      setValueMaxCents(parseBRLToCents(valueMaxDraft))
      setValueOpen(false)
    },
    clearValue: () => {
      setValueMinCents(null)
      setValueMaxCents(null)
      setValueMinDraft('')
      setValueMaxDraft('')
    },
    filtered,
    totalCount: payables.length,
    toggle: (payableId) => {
      // Mudar a seleção re-fecha o painel de tratamento: ele só reabre via clique em Conciliar.
      setRevealTreatment(false)
      setCostCenterRef('')
      setObservation('')
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
      setCostCenterRef('')
      setObservation('')
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
      const note = observation.trim()
      mut.mutate({
        transactionId: selectedTx.id,
        payableIds: [...selectedIds],
        difference:
          residual !== 0 && treatment !== null
            ? {
                valueCents: residual,
                treatment,
                ...(costCenterRef !== '' ? { costCenterRef } : {}),
                ...(note !== '' ? { note } : {}),
              }
            : undefined,
      })
    },
  }
}
