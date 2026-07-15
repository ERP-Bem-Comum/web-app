/**
 * ViewModel PURO (§XI, agnóstico de framework) do Insights do plano (feature 060 + core-api#416). Deriva o que
 * o modal burro apresenta a partir do comparativo do BFF. Sem React/TanStack — só `node:test`.
 *
 * Desenho: HANDBOOK §1.6 — "Histórico" (média dos últimos 5 anos) + card do ano com
 * **Planejado · Realizado · Média por rede**, mais o comparativo ano-a-ano (rótulos + delta + tom).
 *
 * ── HONESTIDADE (#416) ── `realizedInCents`/`networksCount` são `null` quando o core-api de produção está
 * atrás da `dev`. Nesse caso a UI mostra **"—"**, NUNCA `R$ 0,00`: zero significaria "nada foi realizado"
 * (afirmação falsa); "—" significa "não sabemos" (verdade).
 *
 * ── "REDES", não "Estados" ── O HANDBOOK §1.6 escreve "Média de N Estados", mas `GET /:id/insights` devolve
 * só `networksCount` — sem a granularidade do programa (estado × município). Como `derivePartnersLabel` já
 * usa "redes" para o caso misto, adotamos o termo neutro: "N redes" nunca está errado, enquanto "N estados"
 * quebraria num programa municipal. Se o core expuser `networkKind` aqui, é trocar por `derivePartnersLabel`.
 */
import { formatCentsBRL } from '#modules/budget-plans/client/domain/calc/derive.ts'
import type {
  BudgetPlanInsights,
  InsightsYear,
} from '#modules/budget-plans/client/data/model/plan-actions.model.ts'

export type DeltaTone = 'up' | 'down' | 'flat'

/** Nº de anos anteriores que entram na média do "Histórico" (HANDBOOK §1.6: "últimos 5 anos"). */
const HISTORY_YEARS = 5

/** Placeholder de dado INDISPONÍVEL (≠ zero). Ver "HONESTIDADE" no topo. */
const UNKNOWN = '—'

export type InsightsRow = Readonly<{
  year: number
  totalLabel: string
  /** Variação absoluta vs. ano atual, com sinal (ex.: "+ R$ 1.000,00"). Vazio quando não há base (0). */
  deltaLabel: string
  deltaTone: DeltaTone
}>

export type InsightsView = Readonly<{
  currentYear: number
  /** Planejado do ano (Σ orçado). */
  currentTotalLabel: string
  /** Realizado do ano (Σ conciliado — #416). `UNKNOWN` quando o core não expõe. */
  realizedLabel: string
  /** Planejado ÷ nº de redes. `UNKNOWN` quando não há redes (média de zero não existe) ou o core não expõe. */
  networksAvgLabel: string
  /** Ex.: "3 redes". `UNKNOWN` quando o core não expõe a contagem. */
  networksCountLabel: string
  /** Média do Planejado nos últimos 5 anos anteriores. `UNKNOWN` quando não há ano anterior. */
  historyAvgLabel: string
  rows: readonly InsightsRow[]
}>

const deltaToneFor = (diff: number): DeltaTone => (diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat')

/** Rótulo com sinal explícito ("+ R$ …" / "- R$ …" / "R$ 0,00"). Usa o valor ABSOLUTO no corpo. */
const signedDeltaLabel = (diff: number): string => {
  if (diff === 0) return formatCentsBRL(0)
  const sign = diff > 0 ? '+ ' : '- '
  return `${sign}${formatCentsBRL(Math.abs(diff))}`
}

const toRow = (current: InsightsYear, prev: InsightsYear): InsightsRow => {
  const diff = current.totalInCents - prev.totalInCents
  return {
    year: prev.year,
    totalLabel: formatCentsBRL(prev.totalInCents),
    deltaLabel: signedDeltaLabel(diff),
    deltaTone: deltaToneFor(diff),
  }
}

/** Média (em centavos INTEIROS, §IV) do Planejado dos até-5 anos anteriores mais recentes. */
const historyAverageCents = (previousYears: readonly InsightsYear[]): number | null => {
  if (previousYears.length === 0) return null
  const recent = [...previousYears].sort((a, b) => b.year - a.year).slice(0, HISTORY_YEARS)
  const sum = recent.reduce((acc, y) => acc + y.totalInCents, 0)
  return Math.round(sum / recent.length)
}

/** Planejado ÷ redes. `null` quando a contagem é desconhecida OU zero (não existe média de zero redes). */
const averagePerNetworkCents = (totalInCents: number, networksCount: number | null): number | null =>
  networksCount === null || networksCount === 0 ? null : Math.round(totalInCents / networksCount)

const centsLabelOrUnknown = (cents: number | null): string =>
  cents === null ? UNKNOWN : formatCentsBRL(cents)

export const buildInsightsView = (insights: BudgetPlanInsights): InsightsView => ({
  currentYear: insights.current.year,
  currentTotalLabel: formatCentsBRL(insights.current.totalInCents),
  realizedLabel: centsLabelOrUnknown(insights.current.realizedInCents),
  networksAvgLabel: centsLabelOrUnknown(
    averagePerNetworkCents(insights.current.totalInCents, insights.networksCount),
  ),
  networksCountLabel: insights.networksCount === null ? UNKNOWN : `${String(insights.networksCount)} redes`,
  historyAvgLabel: centsLabelOrUnknown(historyAverageCents(insights.previousYears)),
  rows: insights.previousYears.map((prev) => toRow(insights.current, prev)),
})
