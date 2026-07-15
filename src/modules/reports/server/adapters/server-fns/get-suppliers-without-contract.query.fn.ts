/**
 * Server function: relatório de Fornecedores sem Contrato. GET /api/v2/reports/suppliers-without-contract
 * → { suppliers: [...] }. Fronteira RPC (§III). Sem input. Auth no HANDLER. Erro como valor (§V).
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reportsServer } from '../reports.composition.ts'
import type { SupplierWithoutContract } from '#modules/reports/server/domain/reports.io.ts'
import type { ReportsError } from '#modules/reports/server/domain/errors/reports.errors.ts'

export type GetSuppliersWithoutContractFnResult =
  | Readonly<{ ok: true; data: readonly SupplierWithoutContract[] }>
  | Readonly<{ ok: false; error: ReportsError }>

export const getSuppliersWithoutContractFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<GetSuppliersWithoutContractFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reportsServer().getSuppliersWithoutContract(accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  },
)
