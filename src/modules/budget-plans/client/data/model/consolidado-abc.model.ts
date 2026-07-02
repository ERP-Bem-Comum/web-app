/**
 * client/data Model — Consolidado ABC (HANDBOOK §2). Relatório read-only que agrega os planos APROVADOS por
 * Ano Base × Programa(s): matriz Centro de Custo → Categoria × 12 meses (reusa a árvore consolidada do
 * Detalhe). Espelha o retorno esperado de `GET /budget-plans/consolidated-result`. Front-first: por ora vem
 * de placeholder; a forma já é a do contrato real (troca só a origem — TODO #113).
 */
import * as z from 'zod'

import {
  CostCenterConsolidatedSchema,
  type CostCenterConsolidated,
} from '#modules/budget-plans/client/data/model/plan-detail.model.ts'

/**
 * Resultado consolidado (agregação de planos aprovados). `subtotalsByProgram` alimenta os subtítulos
 * "Programa {abrev}: R$ …" do cabeçalho quando há filtro de programa (HANDBOOK §2).
 */
export type ConsolidatedAbc = Readonly<{
  year: number
  totalInCents: number
  subtotalsByProgram: readonly Readonly<{ program: string; totalInCents: number }>[]
  costCenters: readonly CostCenterConsolidated[]
}>

export const ConsolidatedAbcSchema: z.ZodType<ConsolidatedAbc> = z.object({
  year: z.int(),
  totalInCents: z.int(),
  subtotalsByProgram: z.array(z.object({ program: z.string().trim(), totalInCents: z.int() })),
  costCenters: z.array(CostCenterConsolidatedSchema),
})
