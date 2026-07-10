/**
 * Schema Zod da BORDA (§IX) do input da server fn da lista de Planejamento. O input do client NUNCA é
 * confiável: page/limit + filtros que o core-api da Fatia 1 suporta (year/status). `program`/busca textual
 * entram quando o filtro passar a mandar `programRef` / o core expuser busca (fatia de options).
 */
import * as z from 'zod'

const statusSchema = z.enum(['RASCUNHO', 'EM_CALIBRACAO', 'APROVADO'])

export const ListBudgetPlansInputSchema = z.object({
  page: z.int().positive().default(1),
  limit: z.int().positive().max(100).default(5),
  year: z.int().optional(),
  status: statusSchema.optional(),
})

export type ListBudgetPlansInput = z.infer<typeof ListBudgetPlansInputSchema>

/**
 * Input da BORDA (§IX) do `POST /budget-plans` (feature 058). Contrato real do core: ano inteiro + `programRef`
 * (UUID do catálogo do budget-plans). Sem `yearForImport` — o import fica fora desta fase.
 */
export const CreateBudgetPlanInputSchema = z.object({
  year: z.int(),
  programRef: z.uuid(),
})

export type CreateBudgetPlanInput = z.infer<typeof CreateBudgetPlanInputSchema>

/**
 * Input da BORDA (§IX) do `GET /budget-plans/:id` (feature 059 — leitura do detalhe). Só o id do plano (UUID
 * do agregado novo). `z.uuid` é RFC-strict (a rota já valida o path param; a fn revalida — nada confia no client).
 */
export const GetBudgetPlanDetailInputSchema = z.object({
  id: z.uuid(),
})

export type GetBudgetPlanDetailInput = z.infer<typeof GetBudgetPlanDetailInputSchema>

/**
 * Inputs da BORDA (§IX) das AÇÕES do menu (feature 060). `PlanIdInputSchema` cobre approve/start-calibration/
 * export/insights (só o id do plano). `CreateSceneryInputSchema` acrescenta o `name` (1..255, contrato do core).
 */
export const PlanIdInputSchema = z.object({
  id: z.uuid(),
})

export type PlanIdInput = z.infer<typeof PlanIdInputSchema>

export const CreateSceneryInputSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(255),
})

export type CreateSceneryInput = z.infer<typeof CreateSceneryInputSchema>

/**
 * Inputs da BORDA (§IX) da ESCRITA da estrutura de custo (feature 061 — Grupo B). Contrato real do core:
 * `name` 1..255; `direction`/`launchType` são os literais EXATOS do backend (não o rótulo PT); refs por UUID.
 */
const directionSchema = z.enum(['A PAGAR', 'A RECEBER'])
const launchTypeSchema = z.enum(['IPCA', 'CAED', 'DESPESAS_PESSOAIS', 'DESPESAS_LOGISTICAS'])
const structureNameSchema = z.string().trim().min(1).max(255)

export const AddCostCenterInputSchema = z.object({
  planId: z.uuid(),
  name: structureNameSchema,
  direction: directionSchema,
})
export type AddCostCenterInput = z.infer<typeof AddCostCenterInputSchema>

export const AddCategoryInputSchema = z.object({
  planId: z.uuid(),
  costCenterId: z.uuid(),
  name: structureNameSchema,
})
export type AddCategoryInput = z.infer<typeof AddCategoryInputSchema>

export const AddSubcategoryInputSchema = z.object({
  planId: z.uuid(),
  categoryId: z.uuid(),
  name: structureNameSchema,
  launchType: launchTypeSchema,
})
export type AddSubcategoryInput = z.infer<typeof AddSubcategoryInputSchema>
