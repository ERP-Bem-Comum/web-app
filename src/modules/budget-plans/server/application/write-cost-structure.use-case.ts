/**
 * Use-cases: ESCRITA da estrutura de custo (feature 061 — Grupo B). Um POST por caso de uso (§III): criar
 * centro / categoria / subcategoria. A cascata (centro→categoria→subcategoria) é responsabilidade do CLIENT
 * (o `ref` uuid do pai vem do `PlanDetail` lido); aqui cada operação é independente e devolve a árvore-eco.
 *
 * Dependência aponta para dentro (§ server): o PORT (`WriteCostStructureClient`) vive AQUI; o adapter o
 * implementa e mapeia o DTO/status do core. Erros como valores (§II): a falha trafega como `Result.err`.
 */
import type { Result } from '#shared/primitives/result.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'
import type {
  AddCostCenterCommand,
  AddCategoryCommand,
  AddSubcategoryCommand,
  PatchCostNodeCommand,
  CostStructureTree,
} from '#modules/budget-plans/server/domain/cost-structure-write.io.ts'

export type WriteCostStructureClient = Readonly<{
  addCostCenter: (
    command: AddCostCenterCommand,
    token: string,
  ) => Promise<Result<CostStructureTree, BudgetPlansError>>
  addCategory: (
    command: AddCategoryCommand,
    token: string,
  ) => Promise<Result<CostStructureTree, BudgetPlansError>>
  addSubcategory: (
    command: AddSubcategoryCommand,
    token: string,
  ) => Promise<Result<CostStructureTree, BudgetPlansError>>
  patchCostNode: (
    command: PatchCostNodeCommand,
    token: string,
  ) => Promise<Result<CostStructureTree, BudgetPlansError>>
}>

export type WriteCostStructureDeps = Readonly<{ client: WriteCostStructureClient }>

export const createAddCostCenter =
  (deps: WriteCostStructureDeps) =>
  (command: AddCostCenterCommand, token: string): Promise<Result<CostStructureTree, BudgetPlansError>> =>
    deps.client.addCostCenter(command, token)

export const createAddCategory =
  (deps: WriteCostStructureDeps) =>
  (command: AddCategoryCommand, token: string): Promise<Result<CostStructureTree, BudgetPlansError>> =>
    deps.client.addCategory(command, token)

export const createAddSubcategory =
  (deps: WriteCostStructureDeps) =>
  (command: AddSubcategoryCommand, token: string): Promise<Result<CostStructureTree, BudgetPlansError>> =>
    deps.client.addSubcategory(command, token)

/** Renomear e/ou (des)ativar um nó (feature 075). Um caso de uso p/ os 3 níveis: o `level` roteia o PATH. */
export const createPatchCostNode =
  (deps: WriteCostStructureDeps) =>
  (command: PatchCostNodeCommand, token: string): Promise<Result<CostStructureTree, BudgetPlansError>> =>
    deps.client.patchCostNode(command, token)
