/**
 * Binding do Detalhe do plano — ADAPTER React (§XI). Front-first: lê o placeholder e monta a matriz
 * ("Consolidado por Mês" OU "Por Rede") pelo ViewModel puro. Visão + semestre = UI-state local.
 * A view consome só o state.
 *
 * 🔁 TODO(#113): trocar `planDetailPlaceholder` por `useQuery(GET /budget-plans/:id + GET /budgets)`; o
 * ViewModel/matriz e a view NÃO mudam — só a origem dos dados.
 */
import { useMemo, useState } from 'react'

import { planDetailPlaceholder } from '#modules/budget-plans/client/data/plan-detail.placeholder.ts'
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

export type PlanDetailState =
  | Readonly<{ status: 'not-found' }>
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
  const detail = useMemo(() => planDetailPlaceholder(id), [id])

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
    if (detail === null) return { status: 'not-found' }
    return {
      status: 'ready',
      header: derivePlanDetailHeader(detail),
      matrix: view === 'month' ? buildMonthlyMatrix(detail, semester) : buildNetworkMatrix(detail),
    }
  }, [detail, view, semester])

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
