/**
 * Use-case do Dashboard (application) — thin sobre a fonte de agregações + a composição pura (§II). O BFF
 * entrega o `DashboardStatisticsDto` COMPLETO por caso de uso (§III). A `DashboardStatisticsSource` é a
 * PORTA (implementada em adapters — hoje a fonte placeholder; amanhã o client do core-api#112). Result em
 * tudo; sem `throw` (§II). Espelha `financial.use-cases.ts`.
 */
import { isErr, ok, type Result } from '#shared/primitives/result.ts'
import { composeDashboardStatistics } from '#modules/financial/server/domain/dashboard.composition.ts'
import type {
  DashboardAggregations,
  DashboardStatisticsDto,
} from '#modules/financial/server/domain/dashboard.io.ts'
import type { FinancialError } from '#modules/financial/server/domain/errors/financial.errors.ts'

export type DashboardStatisticsSource = Readonly<{
  getAggregations: (token: string) => Promise<Result<DashboardAggregations, FinancialError>>
}>

type Deps = Readonly<{ source: DashboardStatisticsSource }>

export const createGetDashboardStatistics =
  (deps: Deps) =>
  async (token: string): Promise<Result<DashboardStatisticsDto, FinancialError>> => {
    const r = await deps.source.getAggregations(token)
    if (isErr(r)) return r
    return ok(composeDashboardStatistics(r.value))
  }
