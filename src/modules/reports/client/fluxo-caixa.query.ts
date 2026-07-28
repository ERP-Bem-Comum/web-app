/**
 * cashflowReportQueryOptions — data AGNÓSTICA do "Fluxo de Caixa" (#590; sem React). A queryFn devolve o
 * `Result` MAPEADO (`{ data, error }`) p/ o binding ramificar loading/error/ready — o view-model fica puro. O
 * BFF já compõe as 2 chamadas (Slice A + Slice B) numa resposta só. O FILTRO entra na queryKey → filtro
 * diferente re-busca. Espelha `posicao.query.ts`/`analise.query.ts`.
 */
import { reportsRepository } from '#modules/reports/client/data/repository/reports.repository.instance.ts'
import type { CashflowReport, CashflowFilter } from '#modules/reports/client/data/model/cashflow.model.ts'
import type { ReportsError } from '#modules/reports/client/data/repository/reports-error.ts'

export type CashflowReportResult = Readonly<{
  data: CashflowReport | null
  error: ReportsError | null
}>

/** QueryKey estável a partir do filtro aplicado (campos ausentes → null, ordem fixa). */
export const cashflowReportQueryKey = (f: CashflowFilter) =>
  [
    'reports',
    'cashflow',
    f.programId ?? null,
    f.budgetPlanId ?? null,
    f.dueFrom ?? null,
    f.dueTo ?? null,
    f.accountId ?? null,
    f.costCenterId ?? null,
    f.categoryId ?? null,
    f.subCategoryId ?? null,
    f.entityId ?? null,
    f.status ?? null,
  ] as const

export const cashflowReportQueryOptions = (filter: CashflowFilter) => ({
  queryKey: cashflowReportQueryKey(filter),
  queryFn: async (): Promise<CashflowReportResult> => {
    const res = await reportsRepository.getCashflowReport(filter)
    return res.ok ? { data: res.value, error: null } : { data: null, error: res.error }
  },
  staleTime: 60_000,
  retry: 1,
})
