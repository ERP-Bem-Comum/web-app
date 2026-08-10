/**
 * dashboardRealizedQueryOptions — data AGNÓSTICA (sem React) do gráfico "Realizado × Previsto" (specs/096
 * P3). Keyed por ano + seleção → trocar o plano refetcha SÓ o gráfico (server-state ≠ UI-state, §V). A
 * queryFn devolve o `Result` mapeado (`{ result, error }`) p/ o binding ramificar loading/forbidden/empty/
 * error/ready — a view-model fica pura. Espelha `recent-payments.query.ts`.
 */
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'
import type {
  DashboardRealizedInput,
  DashboardRealizedResult,
} from '#modules/financial/client/data/model/dashboard-realized.model.ts'
import type { FinancialError } from '#modules/financial/client/data/repository/financial-error.ts'

export type DashboardRealizedQueryResult = Readonly<{
  result: DashboardRealizedResult | null
  error: FinancialError | null
}>

// A key inclui a seleção serializada (all | plan:<id>) → cada seleção tem seu cache.
const selectionKey = (input: DashboardRealizedInput): string =>
  input.selection.kind === 'all' ? 'all' : `plan:${input.selection.budgetPlanId}`

export const dashboardRealizedQueryKey = (input: DashboardRealizedInput) =>
  ['financial', 'dashboard-realized', input.year, selectionKey(input)] as const

export const dashboardRealizedQueryOptions = (input: DashboardRealizedInput) => ({
  queryKey: dashboardRealizedQueryKey(input),
  queryFn: async (): Promise<DashboardRealizedQueryResult> => {
    const res = await financialRepository.getDashboardRealized(input)
    return res.ok ? { result: res.value, error: null } : { result: null, error: res.error }
  },
  staleTime: 60_000,
  retry: 1,
})
