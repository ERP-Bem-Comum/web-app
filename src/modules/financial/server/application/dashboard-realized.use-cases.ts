/**
 * Use-case do gráfico "Realizado × Previsto" do Dashboard (application · specs/096 · P3). Orquestra a
 * PORTA (`DashboardRealizedClient`, implementada em adapters): lista os planos aprovados vigentes (opções
 * do dropdown) e busca a(s) série(s) do realized — 1 plano OU fan-out de todos, somando. Compõe o chart
 * via domínio PURO. Result em tudo; sem `throw` (§II). Fail-closed: um plano faltante no "somados" NÃO é
 * somado como zero silencioso → o chart fica indisponível (o erro trafega como valor).
 */
import { isErr, ok, type Result } from '#shared/primitives/result.ts'
import {
  sumRealizedSeries,
  composeRealizedChart,
  emptyRealizedChart,
} from '#modules/financial/server/domain/dashboard-realized.compose.ts'
import type {
  DashboardPlanOption,
  DashboardRealizedInput,
  DashboardRealizedResult,
  RealizedPoint,
} from '#modules/financial/server/domain/dashboard-realized.io.ts'
import type { FinancialError } from '#modules/financial/server/domain/errors/financial.errors.ts'

/** Porta do gráfico (implementada por `core-api-dashboard-realized.ts`). */
export type DashboardRealizedClient = Readonly<{
  getRealizedSeries: (
    budgetPlanId: string,
    year: number,
    token: string,
  ) => Promise<Result<readonly RealizedPoint[], FinancialError>>
  listApprovedPlans: (
    year: number,
    token: string,
  ) => Promise<Result<readonly DashboardPlanOption[], FinancialError>>
}>

type Deps = Readonly<{ client: DashboardRealizedClient }>

// Busca todas as séries dos ids; fail-closed: primeiro `err` aborta a soma (não soma faltante como zero).
const fetchAllSeries = async (
  client: DashboardRealizedClient,
  ids: readonly string[],
  year: number,
  token: string,
): Promise<Result<readonly (readonly RealizedPoint[])[], FinancialError>> => {
  const results = await Promise.all(ids.map((id) => client.getRealizedSeries(id, year, token)))
  const series: RealizedPoint[][] = []
  for (const r of results) {
    if (isErr(r)) return r
    series.push([...r.value])
  }
  return ok(series)
}

export const createGetDashboardRealized =
  (deps: Deps) =>
  async (
    input: DashboardRealizedInput,
    token: string,
  ): Promise<Result<DashboardRealizedResult, FinancialError>> => {
    const optionsResult = await deps.client.listApprovedPlans(input.year, token)
    if (isErr(optionsResult)) return optionsResult
    const options = optionsResult.value

    // Sem plano aprovado vigente → estado vazio (chart zerado), mas devolve as opções (vazias) p/ o dropdown.
    if (options.length === 0) return ok({ options, chart: emptyRealizedChart(), empty: true })

    // Ids a buscar: "todos" = todos os aprovados; "plano" = só o escolhido.
    const ids = input.selection.kind === 'all' ? options.map((o) => o.id) : [input.selection.budgetPlanId]

    const seriesResult = await fetchAllSeries(deps.client, ids, input.year, token)
    if (isErr(seriesResult)) return seriesResult

    const { expectedCents, realizedCents } = sumRealizedSeries(seriesResult.value)
    return ok({ options, chart: composeRealizedChart(expectedCents, realizedCents), empty: false })
  }
