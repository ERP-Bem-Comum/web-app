/**
 * Binding do Detalhe do plano — ADAPTER React (§XI). Lê o DETALHE REAL do core-api (`GET /budget-plans/:id`,
 * via `budgetPlansRepository.getPlanDetail`) e monta a matriz ("Consolidado por Mês" OU "Por Rede") pelo
 * ViewModel puro. Visão + semestre = UI-state local. A view consome só o `state` (união discriminada §IV:
 * loading | error | not-found | empty | ready).
 */
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

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
  type AddBudgetForm,
  type AddBudgetError,
} from '#modules/budget-plans/client/planejamento/detalhe/add-budget.view-model.ts'
import {
  useCentrosCusto,
  type CentrosCustoBinding,
} from '#modules/budget-plans/client/planejamento/detalhe/centros-custo.binding.ts'

/** Visões da seção consolidada (HANDBOOK §1.4): por mês (semestres) ou por rede (parceiros). */
export type DetailView = 'month' | 'network'

/**
 * Query key do DETALHE — fonte única compartilhada (a query aqui + a invalidação das ações em
 * `plan-actions.binding.ts`, após approve/start-calibration/scenery). Evita drift de cache.
 */
export const planDetailQueryKey = (id: string): readonly ['budget-plans', 'plan-detail', string] => [
  'budget-plans',
  'plan-detail',
  id,
]

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
  errorTag: AddBudgetError | null
  openModal: () => void
  close: () => void
  setEstado: (v: string) => void
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

  // Modal "Adicionar Orçamento" — UI-state local.
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState<AddBudgetForm>(emptyAddBudgetForm)
  const [addError, setAddError] = useState<AddBudgetError | null>(null)
  const existingNames = detail?.networks.map((n) => n.name) ?? []

  // Modal "Centros de Custo" (§1.5) — binding próprio, alimentado pelo mesmo `detail`.
  const centrosCusto = useCentrosCusto(detail)

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
    options: PLAN_FILTER_ESTADOS,
    errorTag: addError,
    openModal: () => {
      setAddForm(emptyAddBudgetForm())
      setAddError(null)
      setAddOpen(true)
    },
    close: () => {
      setAddOpen(false)
    },
    setEstado: (v) => {
      setAddForm({ estado: v })
      setAddError(null)
    },
    submit: () => {
      const err = validateAddBudget(addForm, PLAN_FILTER_ESTADOS, existingNames)
      if (err !== null) {
        setAddError(err)
        return
      }
      // Front-first: sem persistência (a nova coluna real chega com o #113) — fecha o modal.
      setAddOpen(false)
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
