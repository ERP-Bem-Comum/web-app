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
  PaymentAnalysis,
  RealizedBudgetRow,
} from '#modules/reports/server/domain/reports.io.ts'
import {
  teamReportToModel,
  teamDemographicsToModel,
  suppliersWithoutContractToModel,
  paymentPositionToModel,
  paymentAnalysisToModel,
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
  getPaymentPosition: async (token): Promise<Result<readonly PaymentPosition[], ReportsError>> => {
    const r = await resultFetch<unknown>(`${baseUrl}/payment-position`, { token })
    if (isErr(r)) return err(mapHttpError(r.error))
    return paymentPositionToModel(r.value)
  },
  getPaymentAnalysis: async (query, token): Promise<Result<PaymentAnalysis, ReportsError>> => {
    // Janela [dueStart, dueEnd) obrigatória; status opcional. #446.
    const qs = new URLSearchParams({ dueStart: query.dueStart, dueEnd: query.dueEnd })
    if (query.status !== undefined) qs.set('status', query.status)
    const r = await resultFetch<unknown>(`${baseUrl}/analysis/payables?${qs.toString()}`, { token })
    if (isErr(r)) return err(mapHttpError(r.error))
    return paymentAnalysisToModel(r.value)
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
