/**
 * teamReportQueryOptions — data AGNÓSTICA do relatório "Equipe ABC" (#114; sem React). A queryFn devolve o
 * `Result` MAPEADO (`{ data, error }`) p/ o binding ramificar loading/error/ready. Sem input (endpoint
 * LGPD-safe, o BFF compõe a resposta completa). Espelha `posicao.query.ts`.
 */
import { reportsRepository } from '#modules/reports/client/data/repository/reports.repository.instance.ts'
import type { TeamMember } from '#modules/reports/client/data/model/team-report.model.ts'
import type { ReportsError } from '#modules/reports/client/data/repository/reports-error.ts'

export type TeamReportResult = Readonly<{
  data: readonly TeamMember[] | null
  error: ReportsError | null
}>

export const teamReportQueryKey = ['reports', 'team'] as const

export const teamReportQueryOptions = () => ({
  queryKey: teamReportQueryKey,
  queryFn: async (): Promise<TeamReportResult> => {
    const res = await reportsRepository.getTeam()
    return res.ok ? { data: res.value, error: null } : { data: null, error: res.error }
  },
  staleTime: 60_000,
  retry: 1,
})
