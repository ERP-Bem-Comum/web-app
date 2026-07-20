/**
 * Use-cases dos Relatórios (application) — thin sobre a borda; sem I/O direto (o client é injetado).
 * Result em tudo (§II). `ReportsClient` é a porta — implementada em adapters (`core-api-reports.ts`).
 * Espelha `financial.use-cases.ts`. Os 3 casos de uso são de LEITURA (sem input; só o token).
 */
import type { Result } from '#shared/primitives/result.ts'
import type { ReportsError } from '#modules/reports/server/domain/errors/reports.errors.ts'
import type {
  TeamMember,
  TeamDemographics,
  SupplierWithoutContract,
  PaymentPosition,
} from '#modules/reports/server/domain/reports.io.ts'

export type ReportsClient = Readonly<{
  getTeam: (token: string) => Promise<Result<readonly TeamMember[], ReportsError>>
  /** Demografia AGREGADA (core-api#477) — só estatística cruza a fronteira, nunca linha por pessoa. */
  getTeamDemographics: (token: string) => Promise<Result<TeamDemographics, ReportsError>>
  getSuppliersWithoutContract: (
    token: string,
  ) => Promise<Result<readonly SupplierWithoutContract[], ReportsError>>
  getPaymentPosition: (token: string) => Promise<Result<readonly PaymentPosition[], ReportsError>>
}>

type Deps = Readonly<{ client: ReportsClient }>

export const createGetTeamReport =
  (deps: Deps) =>
  (token: string): Promise<Result<readonly TeamMember[], ReportsError>> =>
    deps.client.getTeam(token)

export const createGetTeamDemographics =
  (deps: Deps) =>
  (token: string): Promise<Result<TeamDemographics, ReportsError>> =>
    deps.client.getTeamDemographics(token)

export const createGetSuppliersWithoutContract =
  (deps: Deps) =>
  (token: string): Promise<Result<readonly SupplierWithoutContract[], ReportsError>> =>
    deps.client.getSuppliersWithoutContract(token)

export const createGetPaymentPosition =
  (deps: Deps) =>
  (token: string): Promise<Result<readonly PaymentPosition[], ReportsError>> =>
    deps.client.getPaymentPosition(token)
