/**
 * client/data Model — Consolidado ABC (HANDBOOK §2). Relatório read-only que agrega os planos APROVADOS por
 * Ano Base (× Programa opcional): o TOTAL do ano + a lista de planos por FAMÍLIA (programa) que compõem a
 * curva ABC. Espelha o retorno de `GET /budget-plans/consolidated-result`. Só reflete planos APROVADOS.
 * Centavos (§IV). A MATRIZ Centro × meses (§2) é composta pelo BFF (o endpoint entrega só total por
 * programa) — ver `get-consolidado-abc.use-case.ts`.
 */
import * as z from 'zod'

import {
  CostCenterConsolidatedSchema,
  type CostCenterConsolidated,
} from '#modules/budget-plans/client/data/model/plan-detail.model.ts'

/** Plano aprovado de UM programa (uma família da curva ABC). */
export type ConsolidatedPlan = Readonly<{
  id: string
  programName: string
  programAbbreviation: string
  version: number
  totalInCents: number
}>

/** Resultado consolidado do ano: total geral + os planos (por programa) que o compõem. */
export type ConsolidatedAbc = Readonly<{
  year: number
  totalInCents: number
  plans: readonly ConsolidatedPlan[]
  /** Matriz "Consolidado dos programas" (§2): Centro × 12 meses, categorias sufixadas pelo programa. */
  costCenters: readonly CostCenterConsolidated[]
}>

export const ConsolidatedPlanSchema = z.object({
  id: z.string().trim(),
  programName: z.string().trim(),
  programAbbreviation: z.string().trim(),
  version: z.number(),
  totalInCents: z.int(),
})

export const ConsolidatedAbcSchema: z.ZodType<ConsolidatedAbc> = z.object({
  year: z.int(),
  totalInCents: z.int(),
  plans: z.array(ConsolidatedPlanSchema),
  costCenters: z.array(CostCenterConsolidatedSchema),
})
