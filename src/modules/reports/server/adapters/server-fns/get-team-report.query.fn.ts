/**
 * Server function: relatório de Equipe (ABC — LGPD-safe). GET /api/v2/reports/team → { team: [...] }.
 * Fronteira RPC (§III). Sem input. Auth no HANDLER (não na rota). Erro como valor (§V).
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reportsServer } from '../reports.composition.ts'
import type { TeamMember } from '#modules/reports/server/domain/reports.io.ts'
import type { ReportsError } from '#modules/reports/server/domain/errors/reports.errors.ts'

export type GetTeamReportFnResult =
  | Readonly<{ ok: true; data: readonly TeamMember[] }>
  | Readonly<{ ok: false; error: ReportsError }>

export const getTeamReportFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<GetTeamReportFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reportsServer().getTeamReport(accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  },
)
