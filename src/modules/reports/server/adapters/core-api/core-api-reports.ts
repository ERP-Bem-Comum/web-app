/**
 * Cliente HTTP do core-api para os Relatórios — chama `/api/v2/reports` (3 GET puros, sem query params).
 * NUNCA lança (tudo é Result; `throw` só na borda do `resultFetch`). Server-only (adapters). Anti-corruption:
 * delega a tradução aos mappers PUROS (`reports.mappers.ts`) e o erro a `mapHttpError`. Espelha
 * `core-api-financial.ts`.
 */
import { err, isErr, type Result } from '#shared/primitives/result.ts'
import { resultFetch } from '#external/core-api/result-fetch.ts'
import type { ReportsClient } from '#modules/reports/server/application/reports.use-cases.ts'
import type { ReportsError } from '#modules/reports/server/domain/errors/reports.errors.ts'
import type {
  TeamMember,
  SupplierWithoutContract,
  PaymentPosition,
} from '#modules/reports/server/domain/reports.io.ts'
import {
  teamReportToModel,
  suppliersWithoutContractToModel,
  paymentPositionToModel,
  mapHttpError,
} from './reports.mappers.ts'

export const createCoreApiReportsClient = (baseUrl: string): ReportsClient => ({
  getTeam: async (token): Promise<Result<readonly TeamMember[], ReportsError>> => {
    const r = await resultFetch<unknown>(`${baseUrl}/team`, { token })
    if (isErr(r)) return err(mapHttpError(r.error))
    return teamReportToModel(r.value)
  },
  getSuppliersWithoutContract: async (
    token,
  ): Promise<Result<readonly SupplierWithoutContract[], ReportsError>> => {
    const r = await resultFetch<unknown>(`${baseUrl}/suppliers-without-contract`, { token })
    if (isErr(r)) return err(mapHttpError(r.error))
    return suppliersWithoutContractToModel(r.value)
  },
  getPaymentPosition: async (token): Promise<Result<readonly PaymentPosition[], ReportsError>> => {
    const r = await resultFetch<unknown>(`${baseUrl}/payment-position`, { token })
    if (isErr(r)) return err(mapHttpError(r.error))
    return paymentPositionToModel(r.value)
  },
})
