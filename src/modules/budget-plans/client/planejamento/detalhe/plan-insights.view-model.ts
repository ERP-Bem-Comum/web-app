/**
 * ViewModel PURO (§XI, agnóstico de framework) do Insights do plano (feature 060). Deriva o que o modal burro
 * apresenta a partir do comparativo do BFF (ano atual × anteriores): rótulos em BRL e a variação (delta) de
 * cada ano anterior FRENTE ao ano atual, com o tom (subiu/desceu/igual). Sem React/TanStack — só `node:test`.
 */
import { formatCentsBRL } from '#modules/budget-plans/client/domain/calc/derive.ts'
import type {
  BudgetPlanInsights,
  InsightsYear,
} from '#modules/budget-plans/client/data/model/plan-actions.model.ts'

export type DeltaTone = 'up' | 'down' | 'flat'

export type InsightsRow = Readonly<{
  year: number
  totalLabel: string
  /** Variação absoluta vs. ano atual, com sinal (ex.: "+ R$ 1.000,00"). Vazio quando não há base (0). */
  deltaLabel: string
  deltaTone: DeltaTone
}>

export type InsightsView = Readonly<{
  currentYear: number
  currentTotalLabel: string
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

export const buildInsightsView = (insights: BudgetPlanInsights): InsightsView => ({
  currentYear: insights.current.year,
  currentTotalLabel: formatCentsBRL(insights.current.totalInCents),
  rows: insights.previousYears.map((prev) => toRow(insights.current, prev)),
})
