/**
 * ReportsRepository — porta do client para o BFF dos Relatórios (#114). Converte `{ ok, data|error }` →
 * `Result` (§II). Tipos do próprio `data/model`; `ReportsError`/`FnResult` do `reports-error.ts` neutro
 * (boundary §I). Fns injetadas (testável, sem RPC real). Espelha `financial.repository.ts`. Os 3 casos são de
 * LEITURA (sem input; a server fn checa a sessão no handler e manda só o token ao core-api).
 */
import { ok, err, type Result } from '#shared/primitives/result.ts'
import type { TeamMember, TeamDemographics } from '#modules/reports/client/data/model/team-report.model.ts'
import type { SupplierWithoutContract } from '#modules/reports/client/data/model/supplier-without-contract.model.ts'
import type { PaymentPosition } from '#modules/reports/client/data/model/payment-position.model.ts'
import type {
  PaymentAnalysis,
  PaymentAnalysisQuery,
} from '#modules/reports/client/data/model/payment-analysis.model.ts'
import type {
  RealizedReportQuery,
  RealizedBudgetRow,
} from '#modules/reports/client/data/model/realized-report.model.ts'
import type { ReportsError, FnResult } from '#modules/reports/client/data/repository/reports-error.ts'

type TeamFn = () => Promise<FnResult<readonly TeamMember[]>>
type TeamDemographicsFn = () => Promise<FnResult<TeamDemographics>>
type SuppliersFn = () => Promise<FnResult<readonly SupplierWithoutContract[]>>
type PaymentPositionFn = () => Promise<FnResult<readonly PaymentPosition[]>>
type PaymentAnalysisFn = (query: PaymentAnalysisQuery) => Promise<FnResult<PaymentAnalysis>>
type RealizedReportFn = (query: RealizedReportQuery) => Promise<FnResult<readonly RealizedBudgetRow[]>>

export type ReportsRepository = Readonly<{
  getTeam: () => Promise<Result<readonly TeamMember[], ReportsError>>
  /** Demografia AGREGADA (core-api#477) — só estatística; nunca linha por pessoa. */
  getTeamDemographics: () => Promise<Result<TeamDemographics, ReportsError>>
  getSuppliersWithoutContract: () => Promise<Result<readonly SupplierWithoutContract[], ReportsError>>
  getPaymentPosition: () => Promise<Result<readonly PaymentPosition[], ReportsError>>
  getPaymentAnalysis: (query: PaymentAnalysisQuery) => Promise<Result<PaymentAnalysis, ReportsError>>
  getRealizedReport: (
    query: RealizedReportQuery,
  ) => Promise<Result<readonly RealizedBudgetRow[], ReportsError>>
}>

export const createReportsRepository = (
  deps: Readonly<{
    teamReportFn: TeamFn
    teamDemographicsFn: TeamDemographicsFn
    suppliersWithoutContractFn: SuppliersFn
    paymentPositionFn: PaymentPositionFn
    paymentAnalysisFn: PaymentAnalysisFn
    realizedReportFn: RealizedReportFn
  }>,
): ReportsRepository => ({
  getTeam: async () => {
    const res = await deps.teamReportFn()
    return res.ok ? ok(res.data) : err(res.error)
  },
  getTeamDemographics: async () => {
    const res = await deps.teamDemographicsFn()
    return res.ok ? ok(res.data) : err(res.error)
  },
  getSuppliersWithoutContract: async () => {
    const res = await deps.suppliersWithoutContractFn()
    return res.ok ? ok(res.data) : err(res.error)
  },
  getPaymentPosition: async () => {
    const res = await deps.paymentPositionFn()
    return res.ok ? ok(res.data) : err(res.error)
  },
  getPaymentAnalysis: async (query) => {
    const res = await deps.paymentAnalysisFn(query)
    return res.ok ? ok(res.data) : err(res.error)
  },
  getRealizedReport: async (query) => {
    const res = await deps.realizedReportFn(query)
    return res.ok ? ok(res.data) : err(res.error)
  },
})
