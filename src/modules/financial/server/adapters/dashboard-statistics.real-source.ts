/**
 * ★ FONTE REAL das agregações CRUAS do Dashboard — de-interim FASEADO (specs/096). Substitui a fonte
 * placeholder na composição. Ligado: P1 = KPI "Despesas por Centro de Custo" (#241 + motor #237, via
 * `GET /financial/dashboard/cost-centers`) → métricas Despesas/Top Centro + donut; P2 = "Fornecedores
 * sem Contrato" (#242, via `GET /financial/dashboard/no-contract-suppliers`). AINDA interinos (reuso do
 * placeholder): séries do gráfico (P3 · `/reports/dashboard/realized`) e as métricas Receita/Maior-
 * Financiador (SEM endpoint → handoff). A composição (`dashboard.composition.ts`) e o DTO NÃO mudam.
 *
 * O core devolve NÚMEROS (centavos + variação como união discriminada); a formatação humana é do BFF
 * (o DTO carrega strings já formatadas p/ apresentação). Erros como valores (§II): DEGRADAÇÃO POR WIDGET
 * — cada endpoint é buscado em paralelo e, num `err` (rede/500/403), SÓ a sua parte cai no interino; os
 * demais widgets continuam com dado real (o "Últimos pagamentos" tem query própria e surfa seu erro).
 */
import { ok, isOk, type Result } from '#shared/primitives/result.ts'
import type { FinancialClient } from '#modules/financial/server/application/financial.use-cases.ts'
import type {
  DashboardAggregations,
  DashboardCostCenters,
  DashboardNoContractSupplier,
  DashboardVariationPercent,
  RawMetricAggregation,
} from '#modules/financial/server/domain/dashboard.io.ts'
import type { FinancialError } from '#modules/financial/server/domain/errors/financial.errors.ts'
import { PLACEHOLDER_AGGREGATIONS } from './dashboard-statistics.placeholder-source.ts'

// i18n key da fatia do donut quando o CC vem sem nome (o donut passa o labelKey por `t()`; nome real
// passa verbatim — `t(key)` devolve a própria chave quando ausente). Ver catalog.pt-BR.
const COST_CENTER_NONE_LABEL_KEY = 'dashboard.cost-center.slice.none'
// Valor de exibição (não passa por `t()`) quando não há Top Centro / nome — símbolo neutro, não texto.
const NO_VALUE = '—'

// ── Formatação (PURA — testável; o DTO carrega strings já apresentáveis) ─────────────────────────
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const pct1 = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
})
const pct0 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

/** Centavos (inteiro) → "R$ 1.234,56". */
export const formatBRLFromCents = (cents: number): string => brl.format(cents / 100)

/** Variação M-1 vs M-2 (união discriminada #237) → texto assinado ("+12,5%" / "0%" / "+"). */
export const formatVariationPercent = (p: DashboardVariationPercent): string => {
  switch (p.kind) {
    case 'value':
      return `${pct1.format(p.percent)}%`
    case 'no-change':
      return '0%'
    case 'new':
      return '+'
    default: {
      const _exhaustive: never = p
      return _exhaustive
    }
  }
}

/** Participação do Top Centro no total ("35%"); guarda divisão por zero. */
export const formatSharePercent = (partCents: number, totalCents: number): string =>
  totalCents > 0 ? `${pct0.format((partCents / totalCents) * 100)}%` : '0%'

// ── Builders PUROS por widget (cada um traduz o CRU real → forma do DashboardAggregations) ────────
/** Métrica Despesas: total M-1 formatado + variação real (M-1 vs M-2). */
export const buildExpensesMetric = (cc: DashboardCostCenters): RawMetricAggregation => ({
  value: formatBRLFromCents(cc.totalExpenses),
  trendPercent: formatVariationPercent(cc.variation.percentage),
})

/** Métrica Top Centro: QUAL centro (nome) + participação no total. `null`/sem-nome → símbolo neutro. */
export const buildTopCostCenterMetric = (cc: DashboardCostCenters): RawMetricAggregation => ({
  value: cc.topCostCenter?.name ?? NO_VALUE,
  trendPercent: cc.topCostCenter ? formatSharePercent(cc.topCostCenter.totalCents, cc.totalExpenses) : '0%',
})

/** Donut de distribuição: `labelKey` = nome real (verbatim via `t`) ou key do nulo; `id` = ref ou sintético. */
export const buildDonut = (cc: DashboardCostCenters): DashboardAggregations['costCenters'] =>
  cc.distribution.map((d, i) => ({
    id: d.ref ?? `cc-null-${String(i)}`,
    labelKey: d.name ?? COST_CENTER_NONE_LABEL_KEY,
    valueCents: Math.max(0, Math.round(d.totalCents)),
  }))

/** Fornecedores sem contrato: nome (nulo → símbolo neutro) + total pago; a composição rankeia/corta. */
export const buildSuppliers = (
  suppliers: readonly DashboardNoContractSupplier[],
): DashboardAggregations['suppliersWithoutContract'] =>
  suppliers.map((s) => ({
    id: s.supplierRef,
    name: s.name ?? NO_VALUE,
    valorTotalCents: Math.max(0, Math.round(s.totalCents)),
  }))

// ── Assembler PURO: partes reais (ou nulas → interino) → DashboardAggregations ───────────────────
type AggregationParts = Readonly<{
  costCenters: DashboardCostCenters | null
  suppliers: readonly DashboardNoContractSupplier[] | null
}>

/** Monta as agregações cruas; cada parte nula cai no interino (degradação por-widget). */
export const assembleAggregations = (parts: AggregationParts): DashboardAggregations => ({
  metrics: {
    // Despesas + Top Centro (P1). Sem cost-centers → interino.
    expenses: parts.costCenters
      ? buildExpensesMetric(parts.costCenters)
      : PLACEHOLDER_AGGREGATIONS.metrics.expenses,
    // SEM endpoint no dashboard do core-api → sempre interinos (handoff).
    revenue: PLACEHOLDER_AGGREGATIONS.metrics.revenue,
    topFinancier: PLACEHOLDER_AGGREGATIONS.metrics.topFinancier,
    topCostCenter: parts.costCenters
      ? buildTopCostCenterMetric(parts.costCenters)
      : PLACEHOLDER_AGGREGATIONS.metrics.topCostCenter,
  },
  // Séries do gráfico Previsto × Realizado — P3 (ainda interino).
  monthlyForecast: PLACEHOLDER_AGGREGATIONS.monthlyForecast,
  monthlyRealized: PLACEHOLDER_AGGREGATIONS.monthlyRealized,
  // Donut (P1). Sem cost-centers → interino.
  costCenters: parts.costCenters ? buildDonut(parts.costCenters) : PLACEHOLDER_AGGREGATIONS.costCenters,
  // Fornecedores sem contrato (P2). Sem suppliers → interino.
  suppliersWithoutContract: parts.suppliers
    ? buildSuppliers(parts.suppliers)
    : PLACEHOLDER_AGGREGATIONS.suppliersWithoutContract,
})

type Deps = Readonly<{ client: FinancialClient }>

/**
 * Fonte real plugável em `DashboardStatisticsSource.getAggregations`. Busca cost-centers (P1) e
 * fornecedores (P2) EM PARALELO e monta as agregações; um `err` degrada SÓ a sua parte (por-widget).
 */
export const createGetDashboardAggregationsReal =
  (deps: Deps) =>
  async (token: string): Promise<Result<DashboardAggregations, FinancialError>> => {
    const [cc, suppliers] = await Promise.all([
      deps.client.getDashboardCostCenters(token),
      deps.client.getDashboardNoContractSuppliers(token),
    ])
    return ok(
      assembleAggregations({
        costCenters: isOk(cc) ? cc.value : null,
        suppliers: isOk(suppliers) ? suppliers.value : null,
      }),
    )
  }
