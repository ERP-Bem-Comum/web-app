/**
 * Binding da lista de Planejamento — ADAPTER React (§XI). Por ora deriva as linhas dos DADOS PLACEHOLDER
 * (front-first: o core-api ainda não tem `GET /budget-plans`, ver HANDBOOK §B). Filtra/pagina no client e
 * transforma os nós em `PlanRow` pelo ViewModel puro (`toPlanRow`). A view consome só o resultado.
 *
 * 🔁 TODO(#113): trocar `PLANEJAMENTO_PLACEHOLDER` por `useQuery(planejamentoListViewModel.query(filters))`
 * (repository → server fn `GET /budget-plans`), mantendo o mesmo `state` (loading | error | ready). A view
 * NÃO muda — só a origem dos dados. O filtro/paginação passam a ser server-side.
 */
import { useMemo } from 'react'

import type { PlanejamentoListFilters } from '#modules/budget-plans/client/data/planejamento-list-filters.schema.ts'
import { FILTER_YEARS } from '#modules/budget-plans/client/data/planejamento-list-filters.schema.ts'
import { PLANEJAMENTO_PLACEHOLDER } from '#modules/budget-plans/client/data/planejamento-list.placeholder.ts'
import { formatCentsBRL } from '#modules/budget-plans/client/domain/calc/derive.ts'

// Re-export dos anos do funil pela camada de binding (a VIEW não importa `data` direto — §XI MVVM).
export { FILTER_YEARS }

// TOTAL geral (rodapé do grid) = soma dos planos-raiz. Constante do placeholder até #113.
export const PLANEJAMENTO_GRAND_TOTAL_LABEL = formatCentsBRL(
  PLANEJAMENTO_PLACEHOLDER.reduce((acc, p) => acc + p.totalInCents, 0),
)
import {
  filterPlans,
  paginatePlans,
  toPlanRow,
  type PlanRow,
} from '#modules/budget-plans/client/planejamento/planejamento-list.view-model.ts'

export type PlanejamentoListState = Readonly<{
  status: 'ready'
  rows: readonly PlanRow[]
  page: number
  totalPages: number
  total: number
  /** Há filtro ativo? (para distinguir "lista vazia" de "filtro sem resultado"). */
  filtered: boolean
}>

/**
 * Opções de Programa para o funil, derivadas do placeholder (distinct por abreviação/nome). 🔁 TODO(#113):
 * virá de `GET /programs` (options) quando o endpoint existir — o funil passa a filtrar por `programId`.
 */
export const PLANEJAMENTO_PROGRAM_OPTIONS: readonly string[] = Array.from(
  new Set(PLANEJAMENTO_PLACEHOLDER.map((p) => p.programAbbreviation ?? p.programName)),
)

export type PlanejamentoListBinding = Readonly<{
  state: PlanejamentoListState
}>

export function usePlanejamentoList(filters: PlanejamentoListFilters): PlanejamentoListBinding {
  const state = useMemo<PlanejamentoListState>(() => {
    const filtered =
      (filters.search ?? '') !== '' ||
      filters.year !== undefined ||
      (filters.program ?? '') !== '' ||
      filters.status !== undefined

    const matched = filterPlans(PLANEJAMENTO_PLACEHOLDER, {
      search: filters.search,
      year: filters.year,
      program: filters.program,
      status: filters.status,
    })
    const page = paginatePlans(matched, filters.page, filters.limit)
    return {
      status: 'ready',
      rows: page.items.map((node) => toPlanRow(node)),
      page: page.page,
      totalPages: page.totalPages,
      total: page.total,
      filtered,
    }
  }, [filters])

  return { state }
}
