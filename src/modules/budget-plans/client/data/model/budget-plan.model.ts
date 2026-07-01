/**
 * client/data Model — forma do plano orçamentário que a UI consome (§VI, borda do client). Espelha o
 * contrato do legado (HANDBOOK §B.1/B.4 `GET /budget-plans`): raízes + versões-filhas (árvore) + contagem
 * de parceiros. Zod é a fonte da forma; validado contra a resposta real do BFF quando o endpoint existir.
 */
import * as z from 'zod'

import { BudgetPlanStatusSchema } from '#modules/budget-plans/client/data/model/enums.ts'

/** Granularidade da rede do programa — decide se o parceiro é Estado ou Município. */
export const NetworkKindSchema = z.enum(['ESTADO', 'MUNICIPIO'])
export type NetworkKind = z.infer<typeof NetworkKindSchema>

/** Nó da árvore de planos (raiz ou versão-filha). `children` recursivo. Valores em centavos. */
export type BudgetPlanNode = Readonly<{
  id: number
  year: number
  programName: string
  programAbbreviation: string | null
  version: number
  scenarioName: string | null
  status: z.infer<typeof BudgetPlanStatusSchema>
  totalInCents: number
  updatedByName: string
  updatedAt: string
  networkKind: NetworkKind
  partnersCount: number
  children: readonly BudgetPlanNode[]
}>

export const BudgetPlanNodeSchema: z.ZodType<BudgetPlanNode> = z.lazy(() =>
  z.object({
    id: z.int(),
    year: z.int(),
    programName: z.string().trim(),
    programAbbreviation: z.string().trim().nullable(),
    version: z.number(),
    scenarioName: z.string().trim().nullable(),
    status: BudgetPlanStatusSchema,
    totalInCents: z.int().nonnegative(),
    updatedByName: z.string().trim(),
    updatedAt: z.string().trim(),
    networkKind: NetworkKindSchema,
    partnersCount: z.int().nonnegative(),
    children: z.array(BudgetPlanNodeSchema),
  }),
)

/** Resposta paginada da lista de planos. */
export const BudgetPlanListSchema = z.object({
  items: z.array(BudgetPlanNodeSchema),
  page: z.int().positive(),
  limit: z.int().positive(),
  total: z.int().nonnegative(),
})
export type BudgetPlanList = z.infer<typeof BudgetPlanListSchema>

/** Input de filtro/busca da lista (funil: Ano/Programa/Status + busca). */
export const BudgetPlanListParamsSchema = z.object({
  page: z.int().positive().default(1),
  limit: z.int().positive().default(5),
  search: z.string().trim().optional(),
  year: z.int().optional(),
  programId: z.int().optional(),
  status: BudgetPlanStatusSchema.optional(),
})
export type BudgetPlanListParams = z.infer<typeof BudgetPlanListParamsSchema>

/** Input de criação de plano (Ano + Programa; import opcional do ano anterior; cenário opcional). */
export const CreateBudgetPlanInputSchema = z.object({
  year: z.int(),
  programId: z.int(),
  yearForImport: z.int().optional(),
  scenarioName: z.string().trim().min(1).optional(),
})
export type CreateBudgetPlanInput = z.infer<typeof CreateBudgetPlanInputSchema>
