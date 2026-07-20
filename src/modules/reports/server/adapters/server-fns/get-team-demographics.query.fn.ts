/**
 * Server function: demografia AGREGADA da Equipe (core-api#477).
 * `GET /api/v2/reports/team/demographics` → `{ totalActive, gender[], ageRange[], race[] }`.
 * Fronteira RPC (§III). Sem input. Auth no HANDLER (não na rota). Erro como valor (§V).
 *
 * Dado SENSÍVEL: só a estatística agregada atravessa — raça, identidade de gênero e data de nascimento
 * nunca saem como linha por pessoa (Opção A da P.O.; o `/reports/team` da tabela segue LGPD-safe).
 * Endpoint separado de propósito: o RBAC dele pode endurecer sem mexer na tabela.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reportsServer } from '../reports.composition.ts'
import type { TeamDemographics } from '#modules/reports/server/domain/reports.io.ts'
import type { ReportsError } from '#modules/reports/server/domain/errors/reports.errors.ts'

export type GetTeamDemographicsFnResult =
  | Readonly<{ ok: true; data: TeamDemographics }>
  | Readonly<{ ok: false; error: ReportsError }>

export const getTeamDemographicsFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<GetTeamDemographicsFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reportsServer().getTeamDemographics(accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  },
)
