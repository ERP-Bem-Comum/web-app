/**
 * Binding da lista de Planejamento — ADAPTER React (§XI). Lê a lista REAL do core-api (`GET /budget-plans`,
 * via `budgetPlansRepository`) e mantém filtro/busca/paginação CLIENT-SIDE (mesma UX do front-first — só a
 * FONTE mudou de placeholder → real). `programOptions` e o total geral derivam do dado real.
 *
 * INTERINO: busca TODOS os planos UMA vez (`LIST_FETCH_LIMIT`) e filtra/pagina no client — preserva a busca
 * textual e o filtro por Programa que o core-api da Fatia 1 ainda não faz server-side. 🔁 Quando o core expuser
 * busca + filtro por programRef + paginação completos, mover para os params da server fn (troca localizada).
 */
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import type { PlanejamentoListFilters } from '#modules/budget-plans/client/data/planejamento-list-filters.schema.ts'
import { FILTER_YEARS } from '#modules/budget-plans/client/data/planejamento-list-filters.schema.ts'
import { budgetPlansRepository } from '#modules/budget-plans/client/data/repository/budget-plans.repository.instance.ts'
import type { BudgetPlanNode } from '#modules/budget-plans/client/data/model/budget-plan.model.ts'
import type { BudgetPlansError } from '#modules/budget-plans/client/data/repository/budget-plans-error.ts'
import { formatCentsBRL } from '#modules/budget-plans/client/domain/calc/derive.ts'
import {
  filterPlans,
  paginatePlans,
  toPlanRow,
  type PlanRow,
} from '#modules/budget-plans/client/planejamento/planejamento-list.view-model.ts'

// Re-export dos anos do funil pela camada de binding (a VIEW não importa `data` direto — §XI MVVM).
export { FILTER_YEARS }

// Teto do fetch único (o core-api limita `limit` a 100). Suficiente para o volume atual de planos por org.
const LIST_FETCH_LIMIT = 100

const EMPTY_NODES: readonly BudgetPlanNode[] = []

export type PlanejamentoListState = Readonly<{
  status: 'ready'
  rows: readonly PlanRow[]
  page: number
  totalPages: number
  total: number
  /** Há filtro ativo? (para distinguir "lista vazia" de "filtro sem resultado"). */
  filtered: boolean
  /** Carregando a 1ª resposta do BFF (a view mostra o vazio enquanto isso). */
  loading: boolean
  /** Tag de erro do BFF (a UI decide como surfar; null = sem erro). */
  errorTag: BudgetPlansError | null
}>

export type PlanejamentoListBinding = Readonly<{
  state: PlanejamentoListState
  /** Opções de Programa do funil/criação, distinct por abreviação|nome — derivadas do DADO REAL. */
  programOptions: readonly string[]
  /** Rótulo do total geral (rodapé) = soma dos planos-raiz carregados. */
  grandTotalLabel: string
}>

export function usePlanejamentoList(filters: PlanejamentoListFilters): PlanejamentoListBinding {
  const query = useQuery({
    queryKey: ['budget-plans', 'planejamento-list', LIST_FETCH_LIMIT],
    queryFn: () => budgetPlansRepository.listBudgetPlans({ page: 1, limit: LIST_FETCH_LIMIT }),
  })

  const nodes: readonly BudgetPlanNode[] = query.data?.ok === true ? query.data.value.items : EMPTY_NODES
  const errorTag: BudgetPlansError | null = query.data?.ok === false ? query.data.error : null

  const state = useMemo<PlanejamentoListState>(() => {
    const filtered =
      (filters.search ?? '') !== '' ||
      filters.year !== undefined ||
      (filters.program ?? '') !== '' ||
      filters.status !== undefined

    const matched = filterPlans(nodes, {
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
      loading: query.isLoading,
      errorTag,
    }
  }, [filters, nodes, query.isLoading, errorTag])

  const programOptions = useMemo<readonly string[]>(
    () => Array.from(new Set(nodes.map((p) => p.programAbbreviation ?? p.programName))),
    [nodes],
  )
  const grandTotalLabel = useMemo<string>(
    () => formatCentsBRL(nodes.reduce((acc, p) => acc + p.totalInCents, 0)),
    [nodes],
  )

  return { state, programOptions, grandTotalLabel }
}
