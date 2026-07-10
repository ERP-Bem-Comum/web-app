/**
 * client/data Model — retornos das AÇÕES do menu "…" e do Insights (feature 060). Tipos NEUTROS (§I: a camada
 * `client/data` não importa `server/`) que ESPELHAM o que o BFF entrega por caso de uso. A UI consome via
 * repository/binding — nunca toca a server fn direto (§XI).
 */
import type { BudgetPlanStatus } from '#modules/budget-plans/client/data/model/enums.ts'

/** Plano após uma transição de ciclo de vida (approve / start-calibration). */
export type LifecyclePlan = Readonly<{
  id: string
  year: number
  status: BudgetPlanStatus
  version: string
  totalInCents: number
}>

/** Cenário recém-criado a partir de um plano aprovado. */
export type CreatedScenery = Readonly<{
  id: string
  name: string
  status: BudgetPlanStatus
  version: string
}>

/** Total de um ano no comparativo de Insights. */
export type InsightsYear = Readonly<{
  year: number
  totalInCents: number
}>

/** Comparativo de Insights: ano atual do plano × anos anteriores. */
export type BudgetPlanInsights = Readonly<{
  current: InsightsYear
  previousYears: readonly InsightsYear[]
}>

/** Artefato CSV do export (o client só dispara o download). */
export type BudgetPlanCsvFile = Readonly<{
  filename: string
  content: string
}>
