/**
 * Public API do módulo Plano Orçamentário — ÚNICO ponto pelo qual rotas/outros módulos consomem (ADR-0004).
 * Fatia atual (feature 041, fundação pura): enums, tipos de lançamento e o preview de cálculo + derivações.
 * Server functions/pages entram conforme os endpoints do core-api (#113) forem criados.
 */
export {
  BUDGET_PLAN_STATUS,
  RELEASE_TYPE,
  SUB_CATEGORY_TYPE,
  COST_CENTER_TYPE,
  EDUCATION,
  EMPLOYMENT_RELATIONSHIP,
  BudgetPlanStatusSchema,
  ReleaseTypeSchema,
  SubCategoryTypeSchema,
  CostCenterTypeSchema,
} from '#modules/budget-plans/client/data/model/enums.ts'
export type {
  BudgetPlanStatus,
  ReleaseType,
  SubCategoryType,
  CostCenterType,
  Education,
  EmploymentRelationship,
} from '#modules/budget-plans/client/data/model/enums.ts'

export type {
  BudgetResultInput,
  PersonalExpensesInput,
  IpcaInput,
  CaedInput,
  LogisticsExpensesInput,
} from '#modules/budget-plans/client/domain/calc/types.ts'

export {
  previewBudgetResult,
  previewPersonalExpenses,
  previewIpca,
  previewCaed,
  previewLogisticsExpenses,
} from '#modules/budget-plans/client/domain/calc/preview.ts'

export {
  deriveEditable,
  sumMonths,
  formatCentsBRL,
  EDITABLE_STATUSES,
} from '#modules/budget-plans/client/domain/calc/derive.ts'

export {
  BudgetPlanNodeSchema,
  BudgetPlanListSchema,
  BudgetPlanListParamsSchema,
  CreateBudgetPlanInputSchema,
  NetworkKindSchema,
} from '#modules/budget-plans/client/data/model/budget-plan.model.ts'
export type {
  BudgetPlanNode,
  BudgetPlanList,
  BudgetPlanListParams,
  CreateBudgetPlanInput,
  NetworkKind,
} from '#modules/budget-plans/client/data/model/budget-plan.model.ts'

export {
  toPlanRow,
  deriveStatusView,
  derivePlanActions,
  derivePartnersLabel,
  derivePlanDisplayName,
  deriveVersionLabel,
  PLAN_ACTIONS,
} from '#modules/budget-plans/client/planejamento/planejamento-list.view-model.ts'
export type {
  PlanRow,
  PlanAction,
  StatusView,
  StatusTone,
} from '#modules/budget-plans/client/planejamento/planejamento-list.view-model.ts'

export {
  PlanDetailSchema,
  CostCenterConsolidatedSchema,
  MonthlyCentsSchema,
} from '#modules/budget-plans/client/data/model/plan-detail.model.ts'
export type {
  PlanDetail,
  CostCenterConsolidated,
  CategoryConsolidated,
  SubCategoryConsolidated,
} from '#modules/budget-plans/client/data/model/plan-detail.model.ts'

export {
  buildMonthlyMatrix,
  buildNetworkMatrix,
  derivePlanDetailHeader,
  MONTH_HEADERS,
} from '#modules/budget-plans/client/planejamento/detalhe/plan-detail.view-model.ts'
export type {
  MatrixView,
  MatrixRow,
  Semester,
  PlanDetailHeader,
} from '#modules/budget-plans/client/planejamento/detalhe/plan-detail.view-model.ts'
