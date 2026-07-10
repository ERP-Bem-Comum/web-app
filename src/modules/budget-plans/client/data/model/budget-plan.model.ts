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

/**
 * Nó da árvore de planos (raiz ou versão-filha). `children` recursivo. Valores em centavos.
 * `id` = UUID (o modelo NOVO do core-api usa UUID como PK; o front adaptou de `number`). `updatedByName`
 * nullable = auditoria "por quem" ainda não rastreada no agregado novo (data-only até core-api#373).
 */
export type BudgetPlanNode = Readonly<{
  id: string
  year: number
  programName: string
  programAbbreviation: string | null
  version: number
  scenarioName: string | null
  status: z.infer<typeof BudgetPlanStatusSchema>
  totalInCents: number
  updatedByName: string | null
  updatedAt: string
  networkKind: NetworkKind
  partnersCount: number
  children: readonly BudgetPlanNode[]
}>

export const BudgetPlanNodeSchema: z.ZodType<BudgetPlanNode> = z.lazy(() =>
  z.object({
    id: z.string().trim(), // UUID no modelo novo (era number no legado)
    year: z.int(),
    programName: z.string().trim(),
    programAbbreviation: z.string().trim().nullable(),
    version: z.number(),
    scenarioName: z.string().trim().nullable(),
    status: BudgetPlanStatusSchema,
    totalInCents: z.int().nonnegative(),
    updatedByName: z.string().trim().nullable(), // auditoria "por quem": core-api#373
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

/**
 * Input de criação de plano (contrato real do `POST /budget-plans`, feature 058): Ano + `programRef` (UUID do
 * catálogo do budget-plans). Sem `programId`/`yearForImport` — o import fica fora desta fase.
 */
export const CreateBudgetPlanInputSchema = z.object({
  year: z.int(),
  programRef: z.uuid(),
})
export type CreateBudgetPlanInput = z.infer<typeof CreateBudgetPlanInputSchema>

/** Opção de programa do catálogo (fonte do `programRef` real do dropdown). O dropdown exibe `abbreviation`. */
export const BudgetPlanProgramOptionSchema = z.object({
  ref: z.string().trim(),
  abbreviation: z.string().trim(),
})
export type BudgetPlanProgramOption = z.infer<typeof BudgetPlanProgramOptionSchema>

/** Plano recém-criado (resposta do BFF). O binding só o usa para confirmar a persistência e invalidar a lista. */
export type CreatedBudgetPlan = Readonly<{
  id: string
  year: number
  programRef: string
  status: z.infer<typeof BudgetPlanStatusSchema>
  version: string
  totalInCents: number
}>
