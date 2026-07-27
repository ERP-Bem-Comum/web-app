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
  TeamDemographics,
  SupplierWithoutContract,
  PaymentPosition,
  RealizedBudgetRow,
} from '#modules/reports/server/domain/reports.io.ts'
import {
  teamReportToModel,
  teamDemographicsToModel,
  suppliersWithoutContractToModel,
  paymentPositionToModel,
  realizedReportToModel,
  mapHttpError,
} from './reports.mappers.ts'

export const createCoreApiReportsClient = (baseUrl: string): ReportsClient => ({
  getTeam: async (token): Promise<Result<readonly TeamMember[], ReportsError>> => {
    const r = await resultFetch<unknown>(`${baseUrl}/team`, { token })
    if (isErr(r)) return err(mapHttpError(r.error))
    return teamReportToModel(r.value)
  },
  // Demografia agregada (core-api#477). Sensível: só a ESTATÍSTICA cruza — nunca linha por pessoa.
  getTeamDemographics: async (token): Promise<Result<TeamDemographics, ReportsError>> => {
    const r = await resultFetch<unknown>(`${baseUrl}/team/demographics`, { token })
    if (isErr(r)) return err(mapHttpError(r.error))
    return teamDemographicsToModel(r.value)
  },
  getSuppliersWithoutContract: async (
    token,
  ): Promise<Result<readonly SupplierWithoutContract[], ReportsError>> => {
    const r = await resultFetch<unknown>(`${baseUrl}/suppliers-without-contract`, { token })
    if (isErr(r)) return err(mapHttpError(r.error))
    return suppliersWithoutContractToModel(r.value)
  },
  getPaymentPosition: async (filter, token): Promise<Result<readonly PaymentPosition[], ReportsError>> => {
    // Só os campos DEFINIDOS entram na querystring (AND no servidor; ausente = sem recorte). #588.
    const qs = new URLSearchParams()
    if (filter.budgetPlanRef !== undefined) qs.set('budgetPlanRef', filter.budgetPlanRef)
    if (filter.cedenteAccountRef !== undefined) qs.set('cedenteAccountRef', filter.cedenteAccountRef)
    if (filter.costCenterRef !== undefined) qs.set('costCenterRef', filter.costCenterRef)
    if (filter.categoryRef !== undefined) qs.set('categoryRef', filter.categoryRef)
    if (filter.subcategoryRef !== undefined) qs.set('subcategoryRef', filter.subcategoryRef)
    if (filter.supplierRef !== undefined) qs.set('supplierRef', filter.supplierRef)
    if (filter.dueFrom !== undefined) qs.set('dueFrom', filter.dueFrom)
    if (filter.dueTo !== undefined) qs.set('dueTo', filter.dueTo)
    if (filter.status !== undefined) qs.set('status', filter.status)
    const query = qs.toString()
    const url = query === '' ? `${baseUrl}/payment-position` : `${baseUrl}/payment-position?${query}`
    const r = await resultFetch<unknown>(url, { token })
    if (isErr(r)) return err(mapHttpError(r.error))
    return paymentPositionToModel(r.value)
  },
  getRealizedReport: async (query, token): Promise<Result<readonly RealizedBudgetRow[], ReportsError>> => {
    const qs = new URLSearchParams({ year: String(query.year) })
    if (query.programId !== undefined) qs.set('programId', query.programId)
    if (query.budgetPlanId !== undefined) qs.set('budgetPlanId', query.budgetPlanId)
    if (query.partnerStateId !== undefined) qs.set('partnerStateId', query.partnerStateId)
    if (query.partnerMunicipalityId !== undefined)
      qs.set('partnerMunicipalityId', query.partnerMunicipalityId)
    const r = await resultFetch<unknown>(`${baseUrl}/realized?${qs.toString()}`, { token })
    if (isErr(r)) return err(mapHttpError(r.error))
    return realizedReportToModel(r.value)
  },
})
