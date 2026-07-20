/**
 * teamReportQueryOptions — data AGNÓSTICA do relatório "Equipe ABC" (#114; sem React). A queryFn devolve o
 * `Result` MAPEADO (`{ data, error }`) p/ o binding ramificar loading/error/ready. Sem input (endpoint
 * LGPD-safe, o BFF compõe a resposta completa). Espelha `posicao.query.ts`.
 */
import { reportsRepository } from '#modules/reports/client/data/repository/reports.repository.instance.ts'
import type { TeamMember, TeamDemographics } from '#modules/reports/client/data/model/team-report.model.ts'
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

/**
 * Demografia AGREGADA da Equipe (core-api#477). Query SEPARADA da tabela de propósito: são endpoints
 * distintos (`/reports/team` × `/reports/team/demographics`), o dado é sensível e o RBAC pode endurecer
 * só neste — se ele falhar, a tabela continua carregando.
 */
export type TeamDemographicsResult = Readonly<{
  data: TeamDemographics | null
  error: ReportsError | null
}>

export const teamDemographicsQueryKey = ['reports', 'team', 'demographics'] as const

export const teamDemographicsQueryOptions = () => ({
  queryKey: teamDemographicsQueryKey,
  queryFn: async (): Promise<TeamDemographicsResult> => {
    const res = await reportsRepository.getTeamDemographics()
    return res.ok ? { data: res.value, error: null } : { data: null, error: res.error }
  },
  staleTime: 60_000,
  retry: 1,
})
