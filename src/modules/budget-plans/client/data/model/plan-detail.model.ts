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
} from '#modules/budget-plans/client/data/model/enums.ts'

/** 12 valores mensais em centavos (Janeiro…Dezembro). */
export const MonthlyCentsSchema = z.array(z.int()).length(12)
export type MonthlyCents = z.infer<typeof MonthlyCentsSchema>

/**
 * Rede (parceiro) com orçamento no plano — coluna da visão "Por Rede" (Consolidado dos parceiros).
 * Estado OU Município conforme a granularidade do programa (HANDBOOK §1.4).
 */
export type NetworkRef = Readonly<{ id: number; name: string }>
export const NetworkRefSchema: z.ZodType<NetworkRef> = z.object({
  id: z.int(),
  name: z.string().trim(),
})

/**
 * Valores por rede em centavos — MESMA ordem/comprimento de `PlanDetail.networks` (alinhado por índice,
 * como `monthlyInCents` faz com os meses).
 */
export const NetworkCentsSchema = z.array(z.int())
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
  name: string
  totalInCents: number
  monthlyInCents: MonthlyCents
  networkInCents: NetworkCents
  iconKind?: MatrixIconKind
}>

/** Categoria (agrupa subcategorias). */
export type CategoryConsolidated = Readonly<{
  id: number
  name: string
  totalInCents: number
  monthlyInCents: MonthlyCents
  networkInCents: NetworkCents
  subCategories: readonly SubCategoryConsolidated[]
  iconKind?: MatrixIconKind
}>

/** Centro de custo (raiz da árvore consolidada). */
export type CostCenterConsolidated = Readonly<{
  id: number
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
  id: number
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
  name: z.string().trim(),
  totalInCents: z.int(),
  monthlyInCents: MonthlyCentsSchema,
  networkInCents: NetworkCentsSchema,
  iconKind: MatrixIconKindSchema.optional(),
})
export const CategoryConsolidatedSchema: z.ZodType<CategoryConsolidated> = z.object({
  id: z.int(),
  name: z.string().trim(),
  totalInCents: z.int(),
  monthlyInCents: MonthlyCentsSchema,
  networkInCents: NetworkCentsSchema,
  subCategories: z.array(SubCategoryConsolidatedSchema),
  iconKind: MatrixIconKindSchema.optional(),
})
export const CostCenterConsolidatedSchema: z.ZodType<CostCenterConsolidated> = z.object({
  id: z.int(),
  name: z.string().trim(),
  type: CostCenterTypeSchema,
  totalInCents: z.int(),
  monthlyInCents: MonthlyCentsSchema,
  networkInCents: NetworkCentsSchema,
  categories: z.array(CategoryConsolidatedSchema),
  iconKind: MatrixIconKindSchema.optional(),
})
export const PlanDetailSchema: z.ZodType<PlanDetail> = z.object({
  id: z.int(),
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
