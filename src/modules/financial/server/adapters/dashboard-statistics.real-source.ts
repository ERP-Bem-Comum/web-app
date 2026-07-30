/**
 * ★ FONTE REAL das agregações CRUAS do Dashboard — de-interim FASEADO (specs/096). Substitui a fonte
 * placeholder na composição. FASE P1 (esta): liga o KPI "Despesas por Centro de Custo" (#241 + motor de
 * variação #237) via `GET /financial/dashboard/cost-centers` — cobre a métrica Despesas, a métrica Top
 * Centro e o donut de distribuição. As partes ainda NÃO ligadas seguem interinas (reuso do placeholder):
 * séries do gráfico (P3 · `/reports/dashboard/realized`), fornecedores sem contrato (P2 ·
 * `/financial/dashboard/no-contract-suppliers`) e as métricas Receita/Maior-Financiador (SEM endpoint →
 * handoff). A composição (`dashboard.composition.ts`) e o DTO NÃO mudam.
 *
 * O core devolve NÚMEROS (centavos + variação como união discriminada); a formatação humana é do BFF
 * (o DTO carrega strings já formatadas p/ apresentação). Erros como valores (§II): a chamada ao client
 * já trafega `Result`; num `err` (rede/500/403) a fonte DEGRADA para o interino — um widget indisponível
 * não derruba os demais (o widget "Últimos pagamentos" tem query própria e surfa seu próprio erro).
 */
import { ok, isErr, type Result } from '#shared/primitives/result.ts'
import type { FinancialClient } from '#modules/financial/server/application/financial.use-cases.ts'
import type {
  DashboardAggregations,
  DashboardCostCenters,
  DashboardVariationPercent,
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

// ── Assembler PURO: cost-centers real + interinos → DashboardAggregations ────────────────────────
/** Monta as agregações cruas a partir do cost-centers real; demais campos = interino (P2/P3/sem-endpoint). */
export const assembleAggregationsFromCostCenters = (cc: DashboardCostCenters): DashboardAggregations => ({
  metrics: {
    // Despesas do mês (M-1) + variação real M-1 vs M-2.
    expenses: {
      value: formatBRLFromCents(cc.totalExpenses),
      trendPercent: formatVariationPercent(cc.variation.percentage),
    },
    // SEM endpoint no dashboard do core-api → seguem interinos (handoff).
    revenue: PLACEHOLDER_AGGREGATIONS.metrics.revenue,
    topFinancier: PLACEHOLDER_AGGREGATIONS.metrics.topFinancier,
    // Top Centro: QUAL centro (nome) + sua participação no total. `null`/sem-nome → símbolo neutro.
    topCostCenter: {
      value: cc.topCostCenter?.name ?? NO_VALUE,
      trendPercent: cc.topCostCenter
        ? formatSharePercent(cc.topCostCenter.totalCents, cc.totalExpenses)
        : '0%',
    },
  },
  // Séries do gráfico Previsto × Realizado — P3 (ainda interino).
  monthlyForecast: PLACEHOLDER_AGGREGATIONS.monthlyForecast,
  monthlyRealized: PLACEHOLDER_AGGREGATIONS.monthlyRealized,
  // Donut de distribuição por centro de custo (real). `labelKey` = nome real (verbatim via `t`) ou key do nulo.
  costCenters: cc.distribution.map((d, i) => ({
    // `ref` nulo → id sintético com prefixo improvável de colidir com um ref real.
    id: d.ref ?? `cc-null-${String(i)}`,
    labelKey: d.name ?? COST_CENTER_NONE_LABEL_KEY,
    valueCents: Math.max(0, Math.round(d.totalCents)),
  })),
  // Fornecedores sem contrato — P2 (ainda interino).
  suppliersWithoutContract: PLACEHOLDER_AGGREGATIONS.suppliersWithoutContract,
})

type Deps = Readonly<{ client: FinancialClient }>

/**
 * Fonte real (P1) plugável em `DashboardStatisticsSource.getAggregations`. Busca o cost-centers e monta as
 * agregações; num `err` DEGRADA para o interino completo (mantém o restante do Dashboard renderizando).
 */
export const createGetDashboardAggregationsReal =
  (deps: Deps) =>
  async (token: string): Promise<Result<DashboardAggregations, FinancialError>> => {
    const cc = await deps.client.getDashboardCostCenters(token)
    if (isErr(cc)) return ok(PLACEHOLDER_AGGREGATIONS)
    return ok(assembleAggregationsFromCostCenters(cc.value))
  }
