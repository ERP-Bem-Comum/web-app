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
  CashflowRow,
  CashflowChartRow,
  CashflowFilter,
  GeneralReportPage,
} from '#modules/reports/server/domain/reports.io.ts'
import {
  teamReportToModel,
  teamDemographicsToModel,
  suppliersWithoutContractToModel,
  paymentPositionToModel,
  paymentAnalysisToModel,
  realizedReportToModel,
  cashflowToModel,
  cashflowChartToModel,
  costCenterListToModel,
  generalReportToModel,
  mapHttpError,
} from './reports.mappers.ts'

/** Querystring do Fluxo de Caixa (#590) — só os campos DEFINIDOS entram (AND no servidor; ausente = sem recorte). */
const cashflowQuery = (filter: CashflowFilter): string => {
  const qs = new URLSearchParams()
  if (filter.programId !== undefined) qs.set('programId', filter.programId)
  if (filter.budgetPlanId !== undefined) qs.set('budgetPlanId', filter.budgetPlanId)
  if (filter.dueFrom !== undefined) qs.set('dueFrom', filter.dueFrom)
  if (filter.dueTo !== undefined) qs.set('dueTo', filter.dueTo)
  if (filter.accountId !== undefined) qs.set('accountId', filter.accountId)
  if (filter.costCenterId !== undefined) qs.set('costCenterId', filter.costCenterId)
  if (filter.categoryId !== undefined) qs.set('categoryId', filter.categoryId)
  if (filter.subCategoryId !== undefined) qs.set('subCategoryId', filter.subCategoryId)
  if (filter.entityId !== undefined) qs.set('entityId', filter.entityId)
  if (filter.status !== undefined) qs.set('status', filter.status)
  return qs.toString()
}

/**
 * @param baseUrl base de `/reports` (ex.: `${coreApiBase}/reports`).
 * @param financialBaseUrl base de `/financial` (ex.: `${coreApiBase}/financial`) — só p/ o catálogo de
 *   Centros de Custo usado no fan-out do Fluxo (#590 não expõe CC como eixo).
 */
export const createCoreApiReportsClient = (baseUrl: string, financialBaseUrl: string): ReportsClient => ({
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
    filter,
    token,
  ): Promise<Result<readonly SupplierWithoutContract[], ReportsError>> => {
    // Só os campos DEFINIDOS entram na querystring (AND no servidor; ausente = sem recorte). #694.
    const qs = new URLSearchParams()
    if (filter.programId !== undefined) qs.set('programId', filter.programId)
    if (filter.budgetPlanId !== undefined) qs.set('budgetPlanId', filter.budgetPlanId)
    if (filter.costCenterId !== undefined) qs.set('costCenterId', filter.costCenterId)
    if (filter.categoryId !== undefined) qs.set('categoryId', filter.categoryId)
    if (filter.subCategoryId !== undefined) qs.set('subCategoryId', filter.subCategoryId)
    if (filter.dueFrom !== undefined) qs.set('dueFrom', filter.dueFrom)
    if (filter.dueTo !== undefined) qs.set('dueTo', filter.dueTo)
    const query = qs.toString()
    const url =
      query === ''
        ? `${baseUrl}/suppliers-without-contract`
        : `${baseUrl}/suppliers-without-contract?${query}`
    const r = await resultFetch<unknown>(url, { token })
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
  getCashflow: async (
    filter,
    token,
  ): Promise<
    Result<{ payables: readonly CashflowRow[]; receivables: readonly CashflowRow[] }, ReportsError>
  > => {
    const query = cashflowQuery(filter)
    const url = query === '' ? `${baseUrl}/cashflow` : `${baseUrl}/cashflow?${query}`
    const r = await resultFetch<unknown>(url, { token })
    if (isErr(r)) return err(mapHttpError(r.error))
    return cashflowToModel(r.value)
  },
  getCashflowChart: async (filter, token): Promise<Result<readonly CashflowChartRow[], ReportsError>> => {
    const query = cashflowQuery(filter)
    const url = query === '' ? `${baseUrl}/cashflow/chart` : `${baseUrl}/cashflow/chart?${query}`
    const r = await resultFetch<unknown>(url, { token })
    if (isErr(r)) return err(mapHttpError(r.error))
    return cashflowChartToModel(r.value)
  },
  listCostCenters: async (token): Promise<Result<readonly { id: string; name: string }[], ReportsError>> => {
    const r = await resultFetch<unknown>(`${financialBaseUrl}/cost-centers`, { token })
    if (isErr(r)) return err(mapHttpError(r.error))
    return costCenterListToModel(r.value)
  },
  getGeneralReport: async (query, token): Promise<Result<GeneralReportPage, ReportsError>> => {
    // Paginação obrigatória + filtros opcionais (só os DEFINIDOS entram; AND no servidor). #442.
    const qs = new URLSearchParams({ page: String(query.page), limit: String(query.limit) })
    if (query.search !== undefined) qs.set('search', query.search)
    if (query.programId !== undefined) qs.set('programId', query.programId)
    if (query.budgetPlanId !== undefined) qs.set('budgetPlanId', query.budgetPlanId)
    if (query.dueFrom !== undefined) qs.set('dueFrom', query.dueFrom)
    if (query.dueTo !== undefined) qs.set('dueTo', query.dueTo)
    if (query.accountId !== undefined) qs.set('accountId', query.accountId)
    if (query.costCenterId !== undefined) qs.set('costCenterId', query.costCenterId)
    if (query.categoryId !== undefined) qs.set('categoryId', query.categoryId)
    if (query.subCategoryId !== undefined) qs.set('subCategoryId', query.subCategoryId)
    if (query.entityId !== undefined) qs.set('entityId', query.entityId)
    if (query.status !== undefined) qs.set('status', query.status)
    const r = await resultFetch<unknown>(`${baseUrl}/generalReport?${qs.toString()}`, { token })
    if (isErr(r)) return err(mapHttpError(r.error))
    return generalReportToModel(r.value)
  },
})
