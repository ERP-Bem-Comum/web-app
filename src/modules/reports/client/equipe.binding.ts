/**
 * Binding do relatório "Equipe ABC" — ADAPTER React (§XI). Lê a equipe REAL do core-api (endpoint LGPD-safe,
 * via `reportsRepository.getTeam`) e entrega as linhas da tabela já adaptadas pelo view-model puro
 * (`toTeamRows`, com sentinelas honestos p/ idade/gênero/raça-cor que o endpoint não fornece). A View consome
 * o `state` (união discriminada §IV: loading | error | ready). Os 3 gráficos demográficos NÃO derivam daqui —
 * a page passa dataset vazio (empty-state honesto).
 */
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { teamReportQueryOptions } from './equipe.query.ts'
import { toTeamRows, type TeamMemberRow } from './equipe.view-model.ts'
import { reportsErrorTag } from './data/helpers/reports-error-tag.ts'
import type { ReportsError } from './data/repository/reports-error.ts'

export type EquipeBindingState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; error: ReportsError; errorTag: string }>
  | Readonly<{ status: 'ready'; rows: readonly TeamMemberRow[] }>

export function useEquipe(): EquipeBindingState {
  const query = useQuery(teamReportQueryOptions())

  const members = query.data?.data ?? null
  const error: ReportsError | null = query.data?.error ?? null

  return useMemo<EquipeBindingState>(() => {
    if (query.isLoading) return { status: 'loading' }
    if (error !== null) return { status: 'error', error, errorTag: reportsErrorTag(error) }
    if (members !== null) return { status: 'ready', rows: toTeamRows(members) }
    return { status: 'loading' }
  }, [query.isLoading, error, members])
}
