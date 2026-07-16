/**
 * Binding do Consolidado ABC — ADAPTER React (§XI). Lê o consolidado REAL do core-api
 * (`GET /budget-plans/consolidated-result`, via `budgetPlansRepository.getConsolidado`) e monta o cabeçalho +
 * a CURVA por programa pelo ViewModel puro. As opções de Programa do filtro vêm dos PROGRAMAS REAIS ATIVO
 * (`listProgramsFn`) — o `id` do programa É o `programRef` que o consolidado aceita; evita o `GET
 * /budget-plans/options`, que hoje dá 500 (redes[].ref não-UUID — core-api#394). A view consome só o `state`
 * (união discriminada §IV: loading | error | empty | ready).
 */
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { listProgramsFn } from '#modules/programs/public-api/index.ts'
import type { ConsolidadoAbcFilters } from '#modules/budget-plans/client/data/consolidado-abc-filters.schema.ts'
import { CONSOLIDADO_YEARS } from '#modules/budget-plans/client/data/consolidado-abc-filters.schema.ts'
import { budgetPlansRepository } from '#modules/budget-plans/client/data/repository/budget-plans.repository.instance.ts'
import type { ConsolidatedAbc } from '#modules/budget-plans/client/data/model/consolidado-abc.model.ts'
import {
  buildMonthlyMatrixFrom,
  type MatrixView,
  type Semester,
} from '#modules/budget-plans/client/planejamento/detalhe/plan-detail.view-model.ts'
import type { BudgetPlansError } from '#modules/budget-plans/client/data/repository/budget-plans-error.ts'
import {
  deriveConsolidadoHeader,
  deriveConsolidadoCurve,
  hasConsolidadoResult,
  type ConsolidadoAbcHeader,
  type ConsolidadoCurveRow,
} from '#modules/budget-plans/client/planejamento/consolidado/consolidado-abc.view-model.ts'

// A VIEW não importa `data/` direto (§XI MVVM) — os anos do filtro passam pela camada de binding.
export { CONSOLIDADO_YEARS }

/** Opção de programa do filtro (valor = uuid; rótulo = abreviação). */
export type ConsolidadoProgramOption = Readonly<{ ref: string; label: string }>

export type ConsolidadoAbcState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; errorTag: BudgetPlansError }>
  | Readonly<{ status: 'empty'; header: ConsolidadoAbcHeader }>
  | Readonly<{
      status: 'ready'
      header: ConsolidadoAbcHeader
      rows: readonly ConsolidadoCurveRow[]
      /** §2: matriz "Consolidado dos programas" — Centro × meses, do semestre visível. */
      matrix: MatrixView
    }>

export type ConsolidadoAbcBinding = Readonly<{
  state: ConsolidadoAbcState
  /** Opções de Programa (catálogo real) para o filtro. */
  programOptions: readonly ConsolidadoProgramOption[]
  /** Navegação de semestre da matriz (‹ ›) — igual ao Detalhe. UI-state local. */
  prevSemester: () => void
  nextSemester: () => void
}>

/** Query key do consolidado — inclui o filtro (ano + programa) para cache por combinação. */
export const consolidadoQueryKey = (year: number, programRef: string | undefined) =>
  ['budget-plans', 'consolidado', year, programRef ?? 'all'] as const

const programOptionsQueryKey = ['programs', 'options', 'consolidado'] as const

export function useConsolidadoAbc(filters: ConsolidadoAbcFilters): ConsolidadoAbcBinding {
  const query = useQuery({
    queryKey: consolidadoQueryKey(filters.year, filters.programRef),
    queryFn: () =>
      budgetPlansRepository.getConsolidado({ year: filters.year, programRef: filters.programRef }),
  })
  const optionsQuery = useQuery({
    queryKey: programOptionsQueryKey,
    queryFn: async (): Promise<readonly ConsolidadoProgramOption[]> => {
      const r = await listProgramsFn({ data: { status: 'ATIVO', order: 'ASC', page: 1, limit: 25 } })
      return r.ok ? r.data.items.map((p) => ({ ref: p.id, label: p.sigla })) : []
    },
  })

  const result: ConsolidatedAbc | null = query.data?.ok === true ? query.data.value : null
  const errorTag: BudgetPlansError | null = query.data?.ok === false ? query.data.error : null

  // Semestre visível da matriz (‹ ›) — UI-state local, como no Detalhe.
  const [semester, setSemester] = useState<Semester>(0)

  const state = useMemo<ConsolidadoAbcState>(() => {
    if (query.isLoading) return { status: 'loading' }
    if (errorTag !== null) return { status: 'error', errorTag }
    if (result !== null) {
      const header = deriveConsolidadoHeader(result)
      return hasConsolidadoResult(result)
        ? {
            status: 'ready',
            header,
            rows: deriveConsolidadoCurve(result),
            // Reusa a MESMA matriz do Detalhe (§1.4): a pergunta é idêntica — Centro × meses. O que muda é a
            // origem (lá um plano; aqui vários programas fundidos, já resolvido no BFF).
            matrix: buildMonthlyMatrixFrom(result.costCenters, result.totalInCents, semester),
          }
        : { status: 'empty', header }
    }
    return { status: 'loading' }
  }, [query.isLoading, errorTag, result, semester])

  const programOptions = optionsQuery.data ?? []

  return {
    state,
    programOptions,
    prevSemester: () => {
      setSemester(0)
    },
    nextSemester: () => {
      setSemester(1)
    },
  }
}
