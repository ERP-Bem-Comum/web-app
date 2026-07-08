/**
 * Server function: estatísticas do Dashboard "Resumo Mensal" (052/#352). Fronteira RPC ÚNICA (§III, ADR-0049):
 * o BFF compõe o `DashboardStatisticsDto` COMPLETO (4 métricas + gráfico + donut + fornecedores) por caso de
 * uso. Sem input (nada a validar na borda). Auth/RBAC no HANDLER (não na rota — `createServerFn` é chamável
 * por POST direto): sessão + token resolvidos aqui; a agregação real do #112 usará o token no core-api.
 * Erro como VALOR (`FinancialError`, §II/§V). INTERINO: a fonte é placeholder até o core-api#112.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { financialServer } from '../financial.composition.ts'
import type { DashboardStatisticsDto } from '#modules/financial/server/domain/dashboard.io.ts'
import type { FinancialError } from '#modules/financial/server/domain/errors/financial.errors.ts'

export type DashboardStatisticsFnResult =
  | Readonly<{ ok: true; data: DashboardStatisticsDto }>
  | Readonly<{ ok: false; error: FinancialError }>

export const getDashboardStatisticsFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<DashboardStatisticsFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await financialServer().getDashboardStatistics(accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  },
)
