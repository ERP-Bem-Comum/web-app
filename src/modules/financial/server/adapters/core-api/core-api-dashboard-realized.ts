/**
 * Cliente HTTP do gráfico "Realizado × Previsto" do Dashboard (specs/096 · P3). Orquestra DOIS endpoints
 * core-api fora do `/financial`: `GET /reports/dashboard/realized` e `GET /budget-plans` (lista de
 * aprovados). NUNCA lança (tudo Result; `throw` só na borda do `resultFetch`). Server-only (adapters).
 * Anti-corruption: parse na borda + `mapHttpError` (reusa o do financial). Cenários (`parentId != null`)
 * são EXCLUÍDOS das opções — somar plano-pai + cenário duplicaria.
 */
import { err, isErr, ok } from '#shared/primitives/result.ts'
import { resultFetch } from '#external/core-api/result-fetch.ts'
import type { DashboardPlanOption } from '#modules/financial/server/domain/dashboard-realized.io.ts'
import type { DashboardRealizedClient } from '#modules/financial/server/application/dashboard-realized.use-cases.ts'
import { RealizedResponseSchema, ApprovedPlansResponseSchema } from './dashboard-realized.schema.ts'
import { mapHttpError } from './financial.mappers.ts'

/** `base` = raiz versionada do core-api (`.../api/v2`); daqui saem `/reports` e `/budget-plans`. */
export const createDashboardRealizedClient = (base: string): DashboardRealizedClient => {
  const realizedUrl = `${base}/reports/dashboard/realized`
  const budgetPlansUrl = `${base}/budget-plans`
  return {
    getRealizedSeries: async (budgetPlanId, year, token) => {
      const qs = new URLSearchParams({ budgetPlanId, year: String(year) }).toString()
      const r = await resultFetch<unknown>(`${realizedUrl}?${qs}`, { token })
      if (isErr(r)) return err(mapHttpError(r.error))
      const parsed = RealizedResponseSchema.safeParse(r.value)
      if (!parsed.success) return err('server')
      return ok(parsed.data.chart)
    },
    listApprovedPlans: async (year, token) => {
      const qs = new URLSearchParams({
        status: 'APROVADO',
        year: String(year),
        limit: '100',
      }).toString()
      const r = await resultFetch<unknown>(`${budgetPlansUrl}?${qs}`, { token })
      if (isErr(r)) return err(mapHttpError(r.error))
      const parsed = ApprovedPlansResponseSchema.safeParse(r.value)
      if (!parsed.success) return err('server')
      const options: readonly DashboardPlanOption[] = parsed.data.items
        .filter((p) => (p.parentId ?? null) === null && p.status === 'APROVADO')
        .map((p) => ({ id: p.id, label: `${p.programName} · v${p.version}` }))
      return ok(options)
    },
  }
}
