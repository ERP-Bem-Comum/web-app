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
  SuppliersWithoutContractFilter,
  PaymentPosition,
  PaymentPositionFilter,
  PaymentAnalysis,
  PaymentAnalysisQuery,
  RealizedReportQuery,
  RealizedBudgetRow,
  CashflowRow,
  CashflowChartRow,
  CashflowReport,
  CashflowCostCenter,
  CashflowFilter,
  GeneralReportPage,
  GeneralReportQuery,
} from '#modules/reports/server/domain/reports.io.ts'

export type ReportsClient = Readonly<{
  getTeam: (token: string) => Promise<Result<readonly TeamMember[], ReportsError>>
  /** Demografia AGREGADA (core-api#477) — só estatística cruza a fronteira, nunca linha por pessoa. */
  getTeamDemographics: (token: string) => Promise<Result<TeamDemographics, ReportsError>>
  getSuppliersWithoutContract: (
    filter: SuppliersWithoutContractFilter,
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
  /** Catálogo de Centros de Custo (`/financial/cost-centers`) — fonte do fan-out do eixo de CC do Fluxo. */
  listCostCenters: (token: string) => Promise<Result<readonly { id: string; name: string }[], ReportsError>>
  /** Relatório Geral (#442) — ledger plano PAGINADO (page/limit + filtros). */
  getGeneralReport: (
    query: GeneralReportQuery,
    token: string,
  ) => Promise<Result<GeneralReportPage, ReportsError>>
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
  (
    filter: SuppliersWithoutContractFilter,
    token: string,
  ): Promise<Result<readonly SupplierWithoutContract[], ReportsError>> =>
    deps.client.getSuppliersWithoutContract(filter, token)

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

/** Relatório Geral (#442) — thin: repassa a query paginada ao client (o BFF entrega a página pronta, §III). */
export const createGetGeneralReport =
  (deps: Deps) =>
  (query: GeneralReportQuery, token: string): Promise<Result<GeneralReportPage, ReportsError>> =>
    deps.client.getGeneralReport(query, token)

/** Soma os 2 totais (realizado/previsto) de um conjunto de linhas do cashflow. */
const sumCashflowTotals = (rows: readonly CashflowRow[]): { realizedCents: number; expectedCents: number } =>
  rows.reduce(
    (acc, r) => ({
      realizedCents: acc.realizedCents + r.realizedCents,
      expectedCents: acc.expectedCents + r.expectedCents,
    }),
    { realizedCents: 0, expectedCents: 0 },
  )

/**
 * Fan-out do eixo de Centro de Custo (o #590 não o expõe — CA6). Para cada CC do catálogo, refaz o `/cashflow`
 * com `costCenterId` fixado e soma os totais. Roda em paralelo; CC cujo fetch falha OU sem movimento (ambos 0)
 * é DESCARTADO. Ordem DECRESCENTE por realizado, desempate por previsto. Sem `throw` (§II).
 */
const cashflowByCostCenter = async (
  deps: Deps,
  filter: CashflowFilter,
  costCenters: readonly { id: string; name: string }[],
  token: string,
): Promise<readonly CashflowCostCenter[]> => {
  const perCc = await Promise.all(
    costCenters.map(async (cc): Promise<CashflowCostCenter | null> => {
      const r = await deps.client.getCashflow({ ...filter, costCenterId: cc.id }, token)
      if (isErr(r)) return null
      const totals = sumCashflowTotals(r.value.payables)
      if (totals.realizedCents === 0 && totals.expectedCents === 0) return null
      return { ref: cc.id, name: cc.name, ...totals }
    }),
  )
  return perCc
    .filter((c): c is CashflowCostCenter => c !== null)
    .sort((a, b) => b.realizedCents - a.realizedCents || b.expectedCents - a.expectedCents)
}

/**
 * Fluxo de Caixa (#590) — o BFF COMPÕE a resposta completa do caso de uso (§III): busca a árvore (Slice A), a
 * série temporal (Slice B) e o catálogo de Centros de Custo em paralelo; então RECONSTRÓI o eixo de CC via
 * fan-out (`byCostCenter`). Falha na árvore/série → propaga o erro. Falha no catálogo de CC → degrada gracioso
 * (`byCostCenter: []`, sem derrubar o relatório — `reference:read` pode faltar). Sem `throw` (§II).
 */
export const createGetCashflowReport =
  (deps: Deps) =>
  async (filter: CashflowFilter, token: string): Promise<Result<CashflowReport, ReportsError>> => {
    const [tree, chart, costCenters] = await Promise.all([
      deps.client.getCashflow(filter, token),
      deps.client.getCashflowChart(filter, token),
      deps.client.listCostCenters(token),
    ])
    if (isErr(tree)) return tree
    if (isErr(chart)) return chart
    const byCostCenter = costCenters.ok
      ? await cashflowByCostCenter(deps, filter, costCenters.value, token)
      : []
    return ok({
      payables: tree.value.payables,
      receivables: tree.value.receivables,
      chart: chart.value,
      byCostCenter,
    })
  }
