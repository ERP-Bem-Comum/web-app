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
  type MatrixView,
  type PlanDetailHeader,
  type Semester,
} from '#modules/budget-plans/client/planejamento/detalhe/plan-detail.view-model.ts'

/** Visões da seção consolidada (HANDBOOK §1.4): por mês (semestres) ou por rede (parceiros). */
export type DetailView = 'month' | 'network'

export type PlanDetailState =
  | Readonly<{ status: 'not-found' }>
  | Readonly<{ status: 'ready'; header: PlanDetailHeader; matrix: MatrixView }>

export type PlanDetailBinding = Readonly<{
  state: PlanDetailState
  view: DetailView
  setView: (view: DetailView) => void
  prevSemester: () => void
  nextSemester: () => void
}>

export function usePlanDetail(id: number): PlanDetailBinding {
  const [view, setView] = useState<DetailView>('month')
  const [semester, setSemester] = useState<Semester>(0)
  const detail = useMemo(() => planDetailPlaceholder(id), [id])

  const state = useMemo<PlanDetailState>(() => {
    if (detail === null) return { status: 'not-found' }
    return {
      status: 'ready',
      header: derivePlanDetailHeader(detail),
      matrix: view === 'month' ? buildMonthlyMatrix(detail, semester) : buildNetworkMatrix(detail),
    }
  }, [detail, view, semester])

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
  }
}
