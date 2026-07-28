/**
 * Use-cases dos Relatórios (application) — thin sobre a borda; sem I/O direto (o client é injetado).
 * Result em tudo (§II). `ReportsClient` é a porta — implementada em adapters (`core-api-reports.ts`).
 * Espelha `financial.use-cases.ts`. Os 3 casos de uso são de LEITURA (sem input; só o token).
 */
import { ok, isErr, type Result } from '#shared/primitives/result.ts'
import type { ReportsError } from '#modules/reports/server/domain/errors/reports.errors.ts'
import type {
  TeamMember,
  TeamDemographics,
  SupplierWithoutContract,
  PaymentPosition,
  PaymentPositionFilter,
  PaymentAnalysis,
  PaymentAnalysisQuery,
  RealizedReportQuery,
  RealizedBudgetRow,
  CashflowRow,
  CashflowChartRow,
  CashflowReport,
  CashflowFilter,
} from '#modules/reports/server/domain/reports.io.ts'

export type ReportsClient = Readonly<{
  getTeam: (token: string) => Promise<Result<readonly TeamMember[], ReportsError>>
  /** Demografia AGREGADA (core-api#477) — só estatística cruza a fronteira, nunca linha por pessoa. */
  getTeamDemographics: (token: string) => Promise<Result<TeamDemographics, ReportsError>>
  getSuppliersWithoutContract: (
    token: string,
  ) => Promise<Result<readonly SupplierWithoutContract[], ReportsError>>
  getPaymentPosition: (
    filter: PaymentPositionFilter,
    token: string,
  ) => Promise<Result<readonly PaymentPosition[], ReportsError>>
  /** Análise de Pagamentos (#446) — matriz Plano → Centro de Custo × série mensal; janela [dueStart,dueEnd). */
  getPaymentAnalysis: (
    query: PaymentAnalysisQuery,
    token: string,
  ) => Promise<Result<PaymentAnalysis, ReportsError>>
  /** Realizado × Planejado — árvore achatada em linhas folha; `year` obrigatório + filtros opcionais. */
  getRealizedReport: (
    query: RealizedReportQuery,
    token: string,
  ) => Promise<Result<readonly RealizedBudgetRow[], ReportsError>>
  /** Fluxo de Caixa Slice A (#590) — árvore Saídas por Categoria × Subcategoria (`{ payables, receivables }`). */
  getCashflow: (
    filter: CashflowFilter,
    token: string,
  ) => Promise<
    Result<{ payables: readonly CashflowRow[]; receivables: readonly CashflowRow[] }, ReportsError>
  >
  /** Fluxo de Caixa Slice B (#590) — série temporal (mesma agregação com eixo de mês). */
  getCashflowChart: (
    filter: CashflowFilter,
    token: string,
  ) => Promise<Result<readonly CashflowChartRow[], ReportsError>>
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
  (filter: PaymentPositionFilter, token: string): Promise<Result<readonly PaymentPosition[], ReportsError>> =>
    deps.client.getPaymentPosition(filter, token)

export const createGetPaymentAnalysis =
  (deps: Deps) =>
  (query: PaymentAnalysisQuery, token: string): Promise<Result<PaymentAnalysis, ReportsError>> =>
    deps.client.getPaymentAnalysis(query, token)

export const createGetRealizedReport =
  (deps: Deps) =>
  (query: RealizedReportQuery, token: string): Promise<Result<readonly RealizedBudgetRow[], ReportsError>> =>
    deps.client.getRealizedReport(query, token)

/**
 * Fluxo de Caixa (#590) — o BFF COMPÕE a resposta completa do caso de uso (§III): busca a árvore (Slice A) e
 * a série temporal (Slice B) em paralelo e entrega `{ payables, receivables, chart }`. Falha em qualquer uma
 * → propaga o erro (§II, sem `throw`). O client recebe o payload pronto e só apresenta.
 */
export const createGetCashflowReport =
  (deps: Deps) =>
  async (filter: CashflowFilter, token: string): Promise<Result<CashflowReport, ReportsError>> => {
    const [tree, chart] = await Promise.all([
      deps.client.getCashflow(filter, token),
      deps.client.getCashflowChart(filter, token),
    ])
    if (isErr(tree)) return tree
    if (isErr(chart)) return chart
    return ok({ payables: tree.value.payables, receivables: tree.value.receivables, chart: chart.value })
  }
