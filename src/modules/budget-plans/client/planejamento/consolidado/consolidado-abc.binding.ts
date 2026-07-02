/**
 * Binding do Consolidado ABC — ADAPTER React (§XI). Front-first: lê o placeholder (filtrado por Ano+Programa)
 * e monta o cabeçalho + a matriz Centro × meses pelo ViewModel puro. Semestre = UI-state local. A view
 * consome só o state.
 *
 * 🔁 TODO(#113): trocar `consolidadoAbcPlaceholder` por `useQuery(GET /budget-plans/consolidated-result)`; o
 * ViewModel/matriz e a view NÃO mudam — só a origem dos dados (o filtro passa a ser server-side).
 */
import { useMemo, useState } from 'react'

import type { ConsolidadoAbcFilters } from '#modules/budget-plans/client/data/consolidado-abc-filters.schema.ts'
import {
  CONSOLIDADO_YEARS,
  parseProgramsCsv,
} from '#modules/budget-plans/client/data/consolidado-abc-filters.schema.ts'
import {
  consolidadoAbcPlaceholder,
  CONSOLIDADO_PROGRAM_OPTIONS,
} from '#modules/budget-plans/client/data/consolidado-abc.placeholder.ts'
import {
  buildConsolidadoMatrix,
  deriveConsolidadoHeader,
  hasConsolidadoResult,
  type ConsolidadoAbcHeader,
} from '#modules/budget-plans/client/planejamento/consolidado/consolidado-abc.view-model.ts'
import type {
  MatrixView,
  Semester,
} from '#modules/budget-plans/client/planejamento/detalhe/plan-detail.view-model.ts'

// A VIEW não importa `data/` direto (§XI MVVM) — anos/programas do filtro passam pela camada de binding.
export { CONSOLIDADO_YEARS, CONSOLIDADO_PROGRAM_OPTIONS }

export type ConsolidadoAbcState = Readonly<{
  header: ConsolidadoAbcHeader
  matrix: MatrixView
  hasResult: boolean
}>

export type ConsolidadoAbcBinding = Readonly<{
  state: ConsolidadoAbcState
  /** Programas selecionados (derivados do CSV dos search params) — a view usa para o estado do filtro. */
  programs: readonly string[]
  prevSemester: () => void
  nextSemester: () => void
}>

export function useConsolidadoAbc(filters: ConsolidadoAbcFilters): ConsolidadoAbcBinding {
  const [semester, setSemester] = useState<Semester>(0)
  const programs = useMemo(() => parseProgramsCsv(filters.programs), [filters.programs])
  const result = useMemo(() => consolidadoAbcPlaceholder(filters.year, programs), [filters.year, programs])

  const state = useMemo<ConsolidadoAbcState>(
    () => ({
      header: deriveConsolidadoHeader(result),
      matrix: buildConsolidadoMatrix(result, semester),
      hasResult: hasConsolidadoResult(result),
    }),
    [result, semester],
  )

  return {
    state,
    programs,
    prevSemester: () => {
      setSemester(0)
    },
    nextSemester: () => {
      setSemester(1)
    },
  }
}
