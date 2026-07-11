/**
 * Binding do Detalhe do plano — ADAPTER React (§XI). Lê o DETALHE REAL do core-api (`GET /budget-plans/:id`,
 * via `budgetPlansRepository.getPlanDetail`) e monta a matriz ("Consolidado por Mês" OU "Por Rede") pelo
 * ViewModel puro. Visão + semestre = UI-state local. A view consome só o `state` (união discriminada §IV:
 * loading | error | not-found | empty | ready).
 */
import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { isErr } from '#shared/primitives/result.ts'
import { budgetPlansRepository } from '#modules/budget-plans/client/data/repository/budget-plans.repository.instance.ts'
import type { PlanDetail } from '#modules/budget-plans/client/data/model/plan-detail.model.ts'
import type { BudgetPlansError } from '#modules/budget-plans/client/data/repository/budget-plans-error.ts'
import {
  buildMonthlyMatrix,
  buildNetworkMatrix,
  derivePlanDetailHeader,
  municipiosForEstado,
  PLAN_FILTER_ESTADOS,
  type RegionOption,
  type MatrixView,
  type PlanDetailHeader,
  type Semester,
} from '#modules/budget-plans/client/planejamento/detalhe/plan-detail.view-model.ts'
import {
  emptyAddBudgetForm,
  validateAddBudget,
  parseAddBudgetCents,
  type AddBudgetForm,
  type AddBudgetError,
} from '#modules/budget-plans/client/planejamento/detalhe/add-budget.view-model.ts'
import {
  useCentrosCusto,
  type CentrosCustoBinding,
} from '#modules/budget-plans/client/planejamento/detalhe/centros-custo.binding.ts'
import { planDetailQueryKey } from '#modules/budget-plans/client/planejamento/detalhe/plan-detail.query-key.ts'

/** Visões da seção consolidada (HANDBOOK §1.4): por mês (semestres) ou por rede (parceiros). */
export type DetailView = 'month' | 'network'

/**
 * Re-export da query key do DETALHE (definida em módulo neutro `plan-detail.query-key.ts` p/ evitar ciclo).
 * Consumidores existentes (`plan-actions.binding.ts`) seguem importando daqui. Evita drift de cache.
 */
export { planDetailQueryKey }

export type PlanDetailState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; errorTag: BudgetPlansError }>
  | Readonly<{ status: 'not-found' }>
  // `empty` = plano sem centros de custo ainda; carrega a MATRIZ (vazia) p/ a tela mostrar a chrome inteira
  // (action bar + matriz vazia) e o operador conseguir COMEÇAR (adicionar centro de custo, insights, menu).
  | Readonly<{ status: 'empty'; header: PlanDetailHeader; matrix: MatrixView }>
  | Readonly<{ status: 'ready'; header: PlanDetailHeader; matrix: MatrixView }>

/** UI-state do filtro por Rede (Estado + Município). Ao APLICAR ambos, entra em modo edição de orçamento. */
export type PlanDetailFilter = Readonly<{
  estado: string
  municipio: string
  estadoOptions: readonly RegionOption[]
  municipioOptions: readonly RegionOption[]
  setEstado: (estado: string) => void
  setMunicipio: (municipio: string) => void
  apply: () => void
  /** Ambos selecionados E aplicados (Filtrar) → habilita "Editar" no lugar dos toggles. */
  editMode: boolean
}>

/** UI-state do modal "Adicionar Orçamento" (§1.6). Front-first: submeter valida e fecha (persistência #113). */
export type AddBudgetBinding = Readonly<{
  open: boolean
  form: AddBudgetForm
  options: readonly RegionOption[]
  submitting: boolean
  errorTag: AddBudgetError | null
  openModal: () => void
  close: () => void
  setEstado: (v: string) => void
  setValor: (v: string) => void
  submit: () => void
}>

export type PlanDetailBinding = Readonly<{
  state: PlanDetailState
  view: DetailView
  setView: (view: DetailView) => void
  prevSemester: () => void
  nextSemester: () => void
  filter: PlanDetailFilter
  addBudget: AddBudgetBinding
  centrosCusto: CentrosCustoBinding
}>

export function usePlanDetail(id: string): PlanDetailBinding {
  const [view, setView] = useState<DetailView>('month')
  const [semester, setSemester] = useState<Semester>(0)

  const query = useQuery({
    queryKey: planDetailQueryKey(id),
    queryFn: () => budgetPlansRepository.getPlanDetail(id),
  })

  const detail: PlanDetail | null = query.data?.ok === true ? query.data.value : null
  const errorTag: BudgetPlansError | null = query.data?.ok === false ? query.data.error : null

  // Filtro por Rede: rascunho (selects) + aplicado (após "Filtrar"). Mudar um select limpa o aplicado.
  const [estado, setEstadoRaw] = useState('')
  const [municipio, setMunicipio] = useState('')
  const [applied, setApplied] = useState(false)

  // Modal "Adicionar Orçamento" — UI-state local (#394).
  const queryClient = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState<AddBudgetForm>(emptyAddBudgetForm)
  const [addError, setAddError] = useState<AddBudgetError | null>(null)
  const existingRefs = detail?.networks.map((n) => n.ref) ?? []
  // Redes disponíveis (do /options) → opções do modal { value: ref, label: nome }. Kind guardado p/ o POST.
  const networkOptionsQuery = useQuery({
    queryKey: ['budget-plans', 'network-options'] as const,
    queryFn: () => budgetPlansRepository.getNetworkOptions(),
    staleTime: 300_000,
  })
  const redeOptions = networkOptionsQuery.data ?? []
  const addBudgetMutation = useMutation({
    mutationFn: budgetPlansRepository.addBudget,
    onSuccess: (res) => {
      if (isErr(res)) {
        setAddError('save-failed')
        return
      }
      void queryClient.invalidateQueries({ queryKey: planDetailQueryKey(id) })
      setAddError(null)
      setAddOpen(false)
    },
    onError: () => {
      setAddError('save-failed')
    },
  })

  // Modal "Centros de Custo" (§1.5) — binding próprio, alimentado pelo mesmo `detail`. Recebe o `id` do plano
  // p/ a ESCRITA real da estrutura (feature 061) e a invalidação do detalhe após cada POST.
  const centrosCusto = useCentrosCusto(id, detail)

  const state = useMemo<PlanDetailState>(() => {
    if (query.isLoading) return { status: 'loading' }
    if (errorTag === 'budget-plan-not-found') return { status: 'not-found' }
    if (errorTag !== null) return { status: 'error', errorTag }
    if (detail !== null) {
      const header = derivePlanDetailHeader(detail)
      const matrix = view === 'month' ? buildMonthlyMatrix(detail, semester) : buildNetworkMatrix(detail)
      // Vazio (sem centros) e pronto renderizam a MESMA chrome; só muda a dica de vazio na tela.
      return detail.costCenters.length === 0
        ? { status: 'empty', header, matrix }
        : { status: 'ready', header, matrix }
    }
    return { status: 'loading' }
  }, [query.isLoading, errorTag, detail, view, semester])

  const filter: PlanDetailFilter = {
    estado,
    municipio,
    estadoOptions: PLAN_FILTER_ESTADOS,
    municipioOptions: municipiosForEstado(estado),
    setEstado: (next) => {
      setEstadoRaw(next)
      setMunicipio('') // troca de estado zera o município
      setApplied(false)
    },
    setMunicipio: (next) => {
      setMunicipio(next)
      setApplied(false)
    },
    apply: () => {
      if (estado !== '' && municipio !== '') setApplied(true)
    },
    editMode: applied && estado !== '' && municipio !== '',
  }

  const addBudget: AddBudgetBinding = {
    open: addOpen,
    form: addForm,
    options: redeOptions.map((n) => ({ value: n.ref, label: n.name })),
    submitting: addBudgetMutation.isPending,
    errorTag: addError,
    openModal: () => {
      setAddForm(emptyAddBudgetForm())
      setAddError(null)
      setAddOpen(true)
    },
    close: () => {
      if (addBudgetMutation.isPending) return
      setAddOpen(false)
    },
    setEstado: (v) => {
      setAddForm((f) => ({ ...f, estado: v }))
      setAddError(null)
    },
    setValor: (v) => {
      setAddForm((f) => ({ ...f, valor: v }))
      setAddError(null)
    },
    submit: () => {
      const err = validateAddBudget(addForm, existingRefs)
      if (err !== null) {
        setAddError(err)
        return
      }
      const rede = redeOptions.find((n) => n.ref === addForm.estado)
      const cents = parseAddBudgetCents(addForm.valor)
      if (rede === undefined || cents === null) {
        setAddError('valor-required')
        return
      }
      addBudgetMutation.mutate({
        planId: id,
        partnerKind: rede.kind,
        partnerRef: rede.ref,
        valueInCents: cents,
      })
    },
  }

  return {
    state,
    view,
    setView,
    prevSemester: () => {
      setSemester(0)
    },
    nextSemester: () => {
      setSemester(1)
    },
    filter,
    addBudget,
    centrosCusto,
  }
}
