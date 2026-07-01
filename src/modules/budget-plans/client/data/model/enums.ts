/**
 * Enums do módulo Plano Orçamentário — uniões string-literal (§VII: sem `enum`) + Zod (§VI, borda do client).
 * Rótulos LITERAIS alinhados ao legado (ver HANDBOOK-plano-orcamentario-mapa.md §B.2). São a fonte da forma
 * dos dados no client; o server-side tem seus VOs espelhando estes literais (sem import cruzado client↔server).
 */
import * as z from 'zod'

/** Status do plano — só RASCUNHO e EM_CALIBRACAO são editáveis (ver deriveEditable). */
export const BUDGET_PLAN_STATUS = ['RASCUNHO', 'EM_CALIBRACAO', 'APROVADO'] as const
export type BudgetPlanStatus = (typeof BUDGET_PLAN_STATUS)[number]
export const BudgetPlanStatusSchema = z.enum(BUDGET_PLAN_STATUS)

/** Tipo de lançamento da subcategoria = o "índice"/modelo de cálculo (os 4 do legado). */
export const RELEASE_TYPE = ['DESPESAS_PESSOAIS', 'IPCA', 'CAED', 'DESPESAS_LOGISTICAS'] as const
export type ReleaseType = (typeof RELEASE_TYPE)[number]
export const ReleaseTypeSchema = z.enum(RELEASE_TYPE)

/** Natureza da subcategoria: gasto único (institucional) ou replicado por rede. */
export const SUB_CATEGORY_TYPE = ['INSTITUCIONAL', 'REDE'] as const
export type SubCategoryType = (typeof SUB_CATEGORY_TYPE)[number]
export const SubCategoryTypeSchema = z.enum(SUB_CATEGORY_TYPE)

/** Natureza contábil do centro de custo. ⚠️ o VALOR tem espaço ("A PAGAR"/"A RECEBER"), como no legado. */
export const COST_CENTER_TYPE = ['A PAGAR', 'A RECEBER'] as const
export type CostCenterType = (typeof COST_CENTER_TYPE)[number]
export const CostCenterTypeSchema = z.enum(COST_CENTER_TYPE)

/** Escolaridade (modelo folha) — metadado do lançamento de pessoal. */
export const EDUCATION = [
  'EDUCACAO_INFANTIL',
  'ENSINO_FUNDAMENTAL',
  'ENSINO_MEDIO',
  'ENSINO_SUPERIOR',
  'POS_GRADUACAO',
  'MESTRADO',
  'DOUTORADO',
] as const
export type Education = (typeof EDUCATION)[number]
export const EducationSchema = z.enum(EDUCATION)

/** Vínculo empregatício (modelo folha). */
export const EMPLOYMENT_RELATIONSHIP = ['CLT', 'PJ'] as const
export type EmploymentRelationship = (typeof EMPLOYMENT_RELATIONSHIP)[number]
export const EmploymentRelationshipSchema = z.enum(EMPLOYMENT_RELATIONSHIP)
