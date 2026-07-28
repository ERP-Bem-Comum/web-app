/**
 * generalReportQueryOptions — data AGNÓSTICA do "Relatório Geral" (#442; sem React). A queryFn devolve o
 * `Result` MAPEADO (`{ data, error }`) p/ o binding ramificar loading/error/ready. Paginação SERVER-SIDE:
 * page/limit + filtros entram na queryKey → trocar a página/filtro re-busca. Espelha `posicao.query.ts`.
 */
import { reportsRepository } from '#modules/reports/client/data/repository/reports.repository.instance.ts'
import type {
  GeneralReportPage,
  GeneralReportQuery,
} from '#modules/reports/client/data/model/general-report.model.ts'
import type { ReportsError } from '#modules/reports/client/data/repository/reports-error.ts'

export type GeneralReportResult = Readonly<{
  data: GeneralReportPage | null
  error: ReportsError | null
}>

/** QueryKey estável a partir da consulta (page/limit + filtros; ausentes → null, ordem fixa). */
export const generalReportQueryKey = (q: GeneralReportQuery) =>
  [
    'reports',
    'general',
    q.page,
    q.limit,
    q.search ?? null,
    q.programId ?? null,
    q.budgetPlanId ?? null,
    q.dueFrom ?? null,
    q.dueTo ?? null,
    q.accountId ?? null,
    q.costCenterId ?? null,
    q.categoryId ?? null,
    q.subCategoryId ?? null,
    q.entityId ?? null,
    q.status ?? null,
  ] as const

export const generalReportQueryOptions = (query: GeneralReportQuery) => ({
  queryKey: generalReportQueryKey(query),
  queryFn: async (): Promise<GeneralReportResult> => {
    const res = await reportsRepository.getGeneralReport(query)
    return res.ok ? { data: res.value, error: null } : { data: null, error: res.error }
  },
  staleTime: 60_000,
  retry: 1,
})
