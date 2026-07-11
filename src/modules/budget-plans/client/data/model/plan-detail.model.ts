/**
 * client/data Model — Detalhe do plano (HANDBOOK §1.4). Estrutura consolidada: árvore
 * Centro de Custo → Categoria → Subcategoria, cada nó com os 12 valores mensais (centavos) e total.
 * Espelha o retorno esperado de `GET /budget-plans/:id` + grade consolidada (`GET /budgets`). Front-first:
 * por ora vem de placeholder; a forma já é a do contrato real (troca só a origem — TODO #113).
 */
import * as z from 'zod'

import {
  BudgetPlanStatusSchema,
  CostCenterTypeSchema,
  ReleaseTypeSchema,
  type ReleaseType,
} from '#modules/budget-plans/client/data/model/enums.ts'

/** 12 valores mensais em centavos (Janeiro…Dezembro). */
export const MonthlyCentsSchema = z.array(z.int()).length(12).readonly()
export type MonthlyCents = z.infer<typeof MonthlyCentsSchema>

/**
 * Rede (parceiro) com orçamento no plano — coluna da visão "Por Rede" (Consolidado dos parceiros).
 * Estado OU Município conforme a granularidade do programa (HANDBOOK §1.4).
 */
// #394: coluna da visão "Por Rede". `ref` = UF/IBGE (chave natural); `totalInCents` = orçamento da rede.
export type NetworkKind = 'state' | 'municipality'
export type NetworkRef = Readonly<{
  id: number
  name: string
  ref: string
  kind: NetworkKind
  budgetId: string
  totalInCents: number
}>
export const NetworkRefSchema: z.ZodType<NetworkRef> = z.object({
  id: z.int(),
  name: z.string().trim(),
  ref: z.string().trim(),
  kind: z.enum(['state', 'municipality']),
  budgetId: z.string().trim(),
  totalInCents: z.int(),
})

/**
 * Valores por rede em centavos — MESMA ordem/comprimento de `PlanDetail.networks` (alinhado por índice,
 * como `monthlyInCents` faz com os meses).
 */
export const NetworkCentsSchema = z.array(z.int()).readonly()
export type NetworkCents = z.infer<typeof NetworkCentsSchema>

/**
 * Dica de apresentação p/ o ícone do nó na matriz consolidada (o mock usa ícones semânticos por LINHA, não
 * por nível): pessoas (consultoria), formatura (educacional), documento (outras), relatório (avaliação).
 * Opcional — quando ausente, a view cai no ícone padrão por profundidade.
 */
export const MatrixIconKindSchema = z.enum(['people', 'grad', 'doc', 'report'])
export type MatrixIconKind = z.infer<typeof MatrixIconKindSchema>

/** Nó folha (subcategoria) da matriz consolidada. */
export type SubCategoryConsolidated = Readonly<{
  id: number
  ref?: string // #C2: UUID do backend (casa com budget-results.subcategoryId)
  name: string
  totalInCents: number
  monthlyInCents: MonthlyCents
  networkInCents: NetworkCents
  iconKind?: MatrixIconKind
  /** Modelo de cálculo do lançamento (Calculando Gastos §1.8). Ausente ⇒ IPCA (Tipo B, form padrão). */
  releaseType?: ReleaseType
}>

/**
 * Categoria (agrupa subcategorias). `ref` = UUID do backend (feature 061 — o POST de subcategoria referencia
 * a categoria-pai por UUID). Aditivo/opcional: presente no dado REAL do BFF, ausente no placeholder front-first.
 */
export type CategoryConsolidated = Readonly<{
  id: number
  ref?: string
  name: string
  totalInCents: number
  monthlyInCents: MonthlyCents
  networkInCents: NetworkCents
  subCategories: readonly SubCategoryConsolidated[]
  iconKind?: MatrixIconKind
}>

/**
 * Centro de custo (raiz da árvore consolidada). `ref` = UUID do backend (feature 061 — o POST de categoria
 * referencia o centro-pai por UUID). Aditivo/opcional (real do BFF; ausente no placeholder).
 */
export type CostCenterConsolidated = Readonly<{
  id: number
  ref?: string
  name: string
  type: z.infer<typeof CostCenterTypeSchema>
  totalInCents: number
  monthlyInCents: MonthlyCents
  networkInCents: NetworkCents
  categories: readonly CategoryConsolidated[]
  iconKind?: MatrixIconKind
}>

/** Detalhe do plano com a estrutura consolidada (por mês e por rede). */
export type PlanDetail = Readonly<{
  id: string
  year: number
  programName: string
  programAbbreviation: string | null
  version: number
  scenarioName: string | null
  status: z.infer<typeof BudgetPlanStatusSchema>
  totalInCents: number
  networks: readonly NetworkRef[]
  costCenters: readonly CostCenterConsolidated[]
}>

export const SubCategoryConsolidatedSchema: z.ZodType<SubCategoryConsolidated> = z.object({
  id: z.int(),
  ref: z.string().trim().optional(),
  name: z.string().trim(),
  totalInCents: z.int(),
  monthlyInCents: MonthlyCentsSchema,
  networkInCents: NetworkCentsSchema,
  iconKind: MatrixIconKindSchema.optional(),
  releaseType: ReleaseTypeSchema.optional(),
})
export const CategoryConsolidatedSchema: z.ZodType<CategoryConsolidated> = z.object({
  id: z.int(),
  ref: z.string().trim().optional(),
  name: z.string().trim(),
  totalInCents: z.int(),
  monthlyInCents: MonthlyCentsSchema,
  networkInCents: NetworkCentsSchema,
  subCategories: z.array(SubCategoryConsolidatedSchema),
  iconKind: MatrixIconKindSchema.optional(),
})
export const CostCenterConsolidatedSchema: z.ZodType<CostCenterConsolidated> = z.object({
  id: z.int(),
  ref: z.string().trim().optional(),
  name: z.string().trim(),
  type: CostCenterTypeSchema,
  totalInCents: z.int(),
  monthlyInCents: MonthlyCentsSchema,
  networkInCents: NetworkCentsSchema,
  categories: z.array(CategoryConsolidatedSchema),
  iconKind: MatrixIconKindSchema.optional(),
})
// ── Escrita da estrutura de custo (feature 061 — Grupo B). Comandos dos 3 POSTs + a árvore-eco (201). Os
// literais de `direction`/`launchType` = os enums canônicos (o VALOR já é o do backend). ──

/** Comando: criar centro de custo. `direction` = `CostCenterType` (`'A PAGAR' | 'A RECEBER'`). */
export type AddCostCenterInput = Readonly<{
  planId: string
  name: string
  direction: z.infer<typeof CostCenterTypeSchema>
}>

/** Comando: criar categoria sob um centro (`costCenterId` = `ref` uuid do centro). */
export type AddCategoryInput = Readonly<{ planId: string; costCenterId: string; name: string }>

/** Comando: criar subcategoria sob uma categoria (`categoryId` = `ref` uuid; `launchType` = `ReleaseType`). */
export type AddSubcategoryInput = Readonly<{
  planId: string
  categoryId: string
  name: string
  launchType: ReleaseType
}>

/** Árvore-eco devolvida pelos POSTs (201 = a árvore INTEIRA atualizada, com os UUIDs = `ref`). */
export type CostStructureTree = Readonly<{
  budgetPlanId: string
  costCenters: readonly Readonly<{
    ref: string
    name: string
    direction: string
    categories: readonly Readonly<{
      ref: string
      name: string
      subcategories: readonly Readonly<{ ref: string; name: string; launchType: string }>[]
    }>[]
  }>[]
}>

export const PlanDetailSchema: z.ZodType<PlanDetail> = z.object({
  id: z.string().trim(),
  year: z.int(),
  programName: z.string().trim(),
  programAbbreviation: z.string().trim().nullable(),
  version: z.number(),
  scenarioName: z.string().trim().nullable(),
  status: BudgetPlanStatusSchema,
  totalInCents: z.int(),
  networks: z.array(NetworkRefSchema),
  costCenters: z.array(CostCenterConsolidatedSchema),
})
