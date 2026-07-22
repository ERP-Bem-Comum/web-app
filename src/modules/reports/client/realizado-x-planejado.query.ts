/**
 * realizadoReportQueryOptions — data AGNÓSTICA do relatório "Realizado × Planejado" (#114/S6; sem React). A
 * queryFn devolve o `Result` MAPEADO (`{ data, error }`) p/ o binding ramificar loading/error/ready. O input
 * (`year` + filtros) entra na queryKey → troca de filtro re-busca. Espelha `equipe.query.ts`/`posicao.query.ts`.
 */
import { reportsRepository } from '#modules/reports/client/data/repository/reports.repository.instance.ts'
import type {
  RealizedBudgetRow,
  RealizedReportQuery,
} from '#modules/reports/client/data/model/realized-report.model.ts'
import type { ReportsError } from '#modules/reports/client/data/repository/reports-error.ts'

export type RealizadoReportResult = Readonly<{
  data: readonly RealizedBudgetRow[] | null
  error: ReportsError | null
}>

export const realizadoReportQueryKey = (q: RealizedReportQuery) =>
  [
    'reports',
    'realized',
    q.year,
    q.programId ?? null,
    q.budgetPlanId ?? null,
    q.partnerStateId ?? null,
    q.partnerMunicipalityId ?? null,
  ] as const

export const realizadoReportQueryOptions = (q: RealizedReportQuery) => ({
  queryKey: realizadoReportQueryKey(q),
  queryFn: async (): Promise<RealizadoReportResult> => {
    const res = await reportsRepository.getRealizedReport(q)
    return res.ok ? { data: res.value, error: null } : { data: null, error: res.error }
  },
  staleTime: 60_000,
  retry: 1,
})
