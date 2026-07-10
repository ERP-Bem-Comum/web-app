/**
 * Binding do Insights do plano — ADAPTER React (§XI). Busca o comparativo REAL (`GET /:id/insights`, via
 * `budgetPlansRepository.getInsights`) SÓ quando o modal abre (`enabled: open` — lazy). Monta a visão pelo
 * ViewModel puro. A view consome só o `state` (união discriminada §IV: idle | loading | error | ready).
 */
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { budgetPlansRepository } from '#modules/budget-plans/client/data/repository/budget-plans.repository.instance.ts'
import { actionErrorTag } from '#modules/budget-plans/client/planejamento/plan-actions.view-model.ts'
import {
  buildInsightsView,
  type InsightsView,
} from '#modules/budget-plans/client/planejamento/detalhe/plan-insights.view-model.ts'

export type InsightsState =
  | Readonly<{ status: 'idle' }>
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; errorTag: string }>
  | Readonly<{ status: 'ready'; view: InsightsView }>

export type PlanInsightsBinding = Readonly<{
  open: boolean
  state: InsightsState
  openModal: () => void
  close: () => void
}>

export function usePlanInsights(id: string): PlanInsightsBinding {
  const [open, setOpen] = useState(false)

  const query = useQuery({
    queryKey: ['budget-plans', 'plan-insights', id] as const,
    queryFn: () => budgetPlansRepository.getInsights(id),
    enabled: open,
  })

  const state = useMemo<InsightsState>(() => {
    if (!open) return { status: 'idle' }
    if (query.isLoading || query.data === undefined) return { status: 'loading' }
    if (query.data.ok) return { status: 'ready', view: buildInsightsView(query.data.value) }
    return { status: 'error', errorTag: actionErrorTag(query.data.error) }
  }, [open, query.isLoading, query.data])

  return {
    open,
    state,
    openModal: () => {
      setOpen(true)
    },
    close: () => {
      setOpen(false)
    },
  }
}
