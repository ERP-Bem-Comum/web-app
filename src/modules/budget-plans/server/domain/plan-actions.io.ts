/**
 * Tipos de I/O (domínio PURO — sem HTTP) das AÇÕES do Plano Orçamentário (feature 060). O BFF entrega estes
 * shapes PRONTOS por caso de uso (§III). `LifecyclePlan` = plano atualizado após approve/start-calibration;
 * `CreatedScenery` = cenário recém-criado; `BudgetPlanInsights` = comparativo ano atual × anteriores;
 * `BudgetPlanCsv` = artefato do export (o client só baixa).
 */
import type { BudgetPlanStatus } from '#modules/budget-plans/server/domain/planejamento-list.io.ts'

/** Plano após uma transição de ciclo de vida (approve / start-calibration). `version` chega string do core. */
export type LifecyclePlan = Readonly<{
  id: string
  year: number
  status: BudgetPlanStatus
  version: string
  totalInCents: number
}>

/** Cenário recém-criado a partir de um plano aprovado (`POST /:id/scenery`). */
export type CreatedScenery = Readonly<{
  id: string
  name: string
  status: BudgetPlanStatus
  version: string
}>

/** Total de um ano no comparativo de Insights (`GET /:id/insights`). */
export type InsightsYear = Readonly<{
  year: number
  totalInCents: number
  /** #416: Σ dos lançamentos CONCILIADOS do ano (fonte definida pela P.O.). `null` = core-api não expõe. */
  realizedInCents: number | null
}>

/** Comparativo de Insights: ano atual do plano × anos anteriores (ordem entregue pelo core). */
export type BudgetPlanInsights = Readonly<{
  current: InsightsYear
  previousYears: readonly InsightsYear[]
  /** #416: nº de Redes do plano — o FRONT deriva a média por rede. `null` = core-api não expõe. */
  networksCount: number | null
}>

/** Artefato CSV do export (`GET /:id/generate-csv`). O BFF busca os bytes; o client dispara o download. */
export type BudgetPlanCsv = Readonly<{
  filename: string
  content: string
}>
