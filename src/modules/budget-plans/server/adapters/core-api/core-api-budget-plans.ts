/**
 * Cliente HTTP do core-api para o Plano Orçamentário — implementa o PORT `BudgetPlansCoreClient` (application).
 * Chama `/api/v2/budget-plans` (lista), `/options` (abreviação) e `/:id` (budgets → INTERINO de
 * partnersCount/networkKind, core-api#372). NUNCA lança (tudo é Result; `throw` só na borda do `resultFetch`).
 * Anti-corrupção: Zod valida a resposta e o mapeamento DTO→cru mora aqui (o use-case não conhece o DTO do core).
 */
import type * as z from 'zod'

import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import { resultFetch, resultFetchText } from '#external/core-api/result-fetch.ts'
import type { HttpError } from '#shared/http/http-error.types.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'
import type { ListBudgetPlansParams } from '#modules/budget-plans/server/domain/planejamento-list.io.ts'
import type {
  LifecyclePlan,
  CreatedScenery,
  BudgetPlanInsights,
} from '#modules/budget-plans/server/domain/plan-actions.io.ts'
import type { ApproveBudgetPlanClient } from '#modules/budget-plans/server/application/approve-budget-plan.use-case.ts'
import type { StartCalibrationClient } from '#modules/budget-plans/server/application/start-calibration.use-case.ts'
import type {
  CreateSceneryClient,
  CreateSceneryCommand,
} from '#modules/budget-plans/server/application/create-scenery.use-case.ts'
import type { ExportBudgetPlanCsvClient } from '#modules/budget-plans/server/application/export-budget-plan-csv.use-case.ts'
import type { GetBudgetPlanInsightsClient } from '#modules/budget-plans/server/application/get-budget-plan-insights.use-case.ts'
import type {
  BudgetPlansCoreClient,
  RawPlanListPage,
  RawProgramOption,
  RawPlanBudgets,
} from '#modules/budget-plans/server/application/list-budget-plans.use-case.ts'
import type {
  CreateBudgetPlanClient,
  CreateBudgetPlanCommand,
  CreatedBudgetPlan,
} from '#modules/budget-plans/server/application/create-budget-plan.use-case.ts'
import type { GetBudgetPlanDetailClient } from '#modules/budget-plans/server/application/get-budget-plan-detail.use-case.ts'
import type { WriteCostStructureClient } from '#modules/budget-plans/server/application/write-cost-structure.use-case.ts'
import type { BudgetWriteClient } from '#modules/budget-plans/server/application/budget-write.use-case.ts'
import type {
  ConsolidatedResultParams,
  GetConsolidadoAbcClient,
} from '#modules/budget-plans/server/application/get-consolidado-abc.use-case.ts'
import type { ExportConsolidadoAbcCsvClient } from '#modules/budget-plans/server/application/export-consolidado-abc-csv.use-case.ts'
import type { ConsolidatedAbc } from '#modules/budget-plans/server/domain/consolidado-abc.io.ts'
import type {
  CostStructureInput,
  PlanDetailHeaderInput,
  AddBudgetCommand,
  DeleteBudgetCommand,
  NetworkOption,
} from '#modules/budget-plans/server/domain/plan-detail.io.ts'
import type {
  AddCostCenterCommand,
  AddCategoryCommand,
  AddSubcategoryCommand,
  CostStructureTree,
} from '#modules/budget-plans/server/domain/cost-structure-write.io.ts'
import {
  coreListResponseSchema,
  coreOptionsSchema,
  coreDetailSchema,
  coreCostStructureSchema,
  coreCreateResponseSchema,
  coreLifecyclePlanSchema,
  coreScenerySchema,
  coreInsightsSchema,
} from './budget-plans.schema.ts'
import { parseConsolidatedResult } from './consolidado-result.schema.ts'

// Transporte → erro de domínio (§V): 401 = sessão; o resto colapsa em `unexpected` (a UI só vê a tag).
const mapHttpError = (e: HttpError): BudgetPlansError =>
  e.kind === 'http' && e.status === 401 ? 'unauthorized' : 'unexpected'

// Mapa específico da ESCRITA (§V): o `POST` acrescenta 409 (unicidade ano+programa) e 400/422 (payload).
// O core-api colapsa o slug num `code` público (OWASP), então mapeamos por STATUS, não por slug.
const mapCreateHttpError = (e: HttpError): BudgetPlansError => {
  if (e.kind !== 'http') return 'unexpected'
  if (e.status === 401) return 'unauthorized'
  if (e.status === 409) return 'budget-plan-already-exists'
  if (e.status === 400 || e.status === 422) return 'invalid-input'
  return 'unexpected'
}

// Mapa da LEITURA do DETALHE (§V): o `GET /:id` acrescenta 404 (plano inexistente). Mapeamos por STATUS.
// Reusado por insights e export CSV (mesmas 401/404). O CSV/insights não têm 409 de negócio.
const mapDetailHttpError = (e: HttpError): BudgetPlansError => {
  if (e.kind !== 'http') return 'unexpected'
  if (e.status === 401) return 'unauthorized'
  if (e.status === 404) return 'budget-plan-not-found'
  return 'unexpected'
}

// Mapas de CICLO DE VIDA (§V, feature 060): os três endpoints devolvem 409 em transição inválida, mas o
// core-api colapsa o slug num `code` público (OWASP) → 409 é INDISTINGUÍVEL por status. Mapeamos por
// CONTEXTO do endpoint (a mensagem PT mais provável para cada ação). 404 = plano inexistente; 401 = sessão.
const mapApproveHttpError = (e: HttpError): BudgetPlansError => {
  if (e.kind !== 'http') return 'unexpected'
  if (e.status === 401) return 'unauthorized'
  if (e.status === 404) return 'budget-plan-not-found'
  if (e.status === 409) return 'budget-plan-already-approved'
  return 'unexpected'
}
const mapCalibrationHttpError = (e: HttpError): BudgetPlansError => {
  if (e.kind !== 'http') return 'unexpected'
  if (e.status === 401) return 'unauthorized'
  if (e.status === 404) return 'budget-plan-not-found'
  if (e.status === 409) return 'budget-plan-not-approved' // calibração só em plano APROVADO (por contexto)
  return 'unexpected'
}
const mapSceneryHttpError = (e: HttpError): BudgetPlansError => {
  if (e.kind !== 'http') return 'unexpected'
  if (e.status === 401) return 'unauthorized'
  if (e.status === 404) return 'budget-plan-not-found'
  if (e.status === 409) return 'budget-plan-scenery-needs-draft' // cenário só em plano NÃO aprovado (por contexto)
  if (e.status === 400 || e.status === 422) return 'invalid-input'
  return 'unexpected'
}

// Mapa da ESCRITA da estrutura de custo (§V, feature 061): 404 = plano inexistente; 409 = plano não-editável
// (ex.: aprovado — o core esconde o slug, então é por contexto); 400/422 = payload; 401 = sessão.
const mapWriteHttpError = (e: HttpError): BudgetPlansError => {
  if (e.kind !== 'http') return 'unexpected'
  if (e.status === 401) return 'unauthorized'
  if (e.status === 404) return 'budget-plan-not-found'
  if (e.status === 409) return 'budget-plan-not-editable'
  if (e.status === 400 || e.status === 422) return 'invalid-input'
  return 'unexpected'
}

/** Árvore-eco (201 dos POSTs) → forma de domínio (`id` uuid vira `ref`). Anti-corrupção: já validada por Zod. */
const toCostStructureTree = (parsed: z.infer<typeof coreCostStructureSchema>): CostStructureTree => ({
  budgetPlanId: parsed.budgetPlanId,
  costCenters: parsed.costCenters.map((cc) => ({
    ref: cc.id,
    name: cc.name,
    direction: cc.direction,
    categories: cc.categories.map((cat) => ({
      ref: cat.id,
      name: cat.name,
      subcategories: cat.subcategories.map((sub) => ({
        ref: sub.id,
        name: sub.name,
        launchType: sub.launchType,
      })),
    })),
  })),
})

const buildListQuery = (p: ListBudgetPlansParams): string => {
  const q = new URLSearchParams()
  q.set('page', String(p.page))
  q.set('limit', String(p.limit))
  if (p.year !== undefined) q.set('year', String(p.year))
  if (p.status !== undefined) q.set('status', p.status)
  return q.toString()
}

// Query do Consolidado ABC: `year` obrigatório; `programRef` (uuid) opcional filtra por família.
const buildConsolidatedQuery = (p: ConsolidatedResultParams): string => {
  const q = new URLSearchParams()
  q.set('year', String(p.year))
  if (p.programRef !== undefined) q.set('programRef', p.programRef)
  return q.toString()
}

export const createBudgetPlansCoreClient = (
  baseUrl: string,
): BudgetPlansCoreClient &
  CreateBudgetPlanClient &
  GetBudgetPlanDetailClient &
  ApproveBudgetPlanClient &
  StartCalibrationClient &
  CreateSceneryClient &
  ExportBudgetPlanCsvClient &
  GetBudgetPlanInsightsClient &
  WriteCostStructureClient &
  BudgetWriteClient &
  GetConsolidadoAbcClient &
  ExportConsolidadoAbcCsvClient => ({
  listBudgetPlans: async (params, token): Promise<Result<RawPlanListPage, BudgetPlansError>> => {
    const r = await resultFetch<unknown>(`${baseUrl}?${buildListQuery(params)}`, { token })
    if (isErr(r)) return err(mapHttpError(r.error))
    const parsed = coreListResponseSchema.safeParse(r.value)
    if (!parsed.success) return err('unexpected')
    return ok({
      items: parsed.data.items.map((it) => ({
        id: it.id,
        year: it.year,
        status: it.status,
        version: it.version,
        programRef: it.programRef,
        programName: it.programName,
        totalInCents: it.totalInCents,
        updatedAt: it.updatedAt,
      })),
      total: parsed.data.total,
    })
  },
  getProgramOptions: async (token): Promise<Result<readonly RawProgramOption[], BudgetPlansError>> => {
    const r = await resultFetch<unknown>(`${baseUrl}/options`, { token })
    if (isErr(r)) return err(mapHttpError(r.error))
    const parsed = coreOptionsSchema.safeParse(r.value)
    if (!parsed.success) return err('unexpected')
    return ok(parsed.data.programs.map((p) => ({ ref: p.ref, abbreviation: p.abbreviation })))
  },
  // #394: redes disponíveis (UF/IBGE + nome) para adicionar orçamento.
  getNetworkOptions: async (token): Promise<Result<readonly NetworkOption[], BudgetPlansError>> => {
    const r = await resultFetch<unknown>(`${baseUrl}/options`, { token })
    if (isErr(r)) return err(mapHttpError(r.error))
    const parsed = coreOptionsSchema.safeParse(r.value)
    if (!parsed.success) return err('unexpected')
    return ok(parsed.data.redes.map((n) => ({ ref: n.ref, name: n.name, kind: n.kind })))
  },
  addBudget: async (c: AddBudgetCommand, token): Promise<Result<void, BudgetPlansError>> => {
    const r = await resultFetch<unknown>(`${baseUrl}/${c.planId}/budgets`, {
      method: 'POST',
      token,
      body: { partnerKind: c.partnerKind, partnerRef: c.partnerRef, valueInCents: c.valueInCents },
    })
    if (isErr(r)) return err(mapWriteHttpError(r.error))
    return ok(undefined)
  },
  deleteBudget: async (c: DeleteBudgetCommand, token): Promise<Result<void, BudgetPlansError>> => {
    const r = await resultFetch<unknown>(`${baseUrl}/${c.planId}/budgets/${c.budgetId}`, {
      method: 'DELETE',
      token,
    })
    if (isErr(r)) return err(mapWriteHttpError(r.error))
    return ok(undefined)
  },
  getPlanBudgets: async (id, token): Promise<Result<RawPlanBudgets, BudgetPlansError>> => {
    const r = await resultFetch<unknown>(`${baseUrl}/${id}`, { token })
    if (isErr(r)) return err(mapHttpError(r.error))
    const parsed = coreDetailSchema.safeParse(r.value)
    if (!parsed.success) return err('unexpected')
    return ok({ budgets: parsed.data.budgets.map((b) => ({ partnerKind: b.partner.kind })) })
  },
  getPlanDetailHeader: async (
    id: string,
    token: string,
  ): Promise<Result<PlanDetailHeaderInput, BudgetPlansError>> => {
    const r = await resultFetch<unknown>(`${baseUrl}/${id}`, { token })
    if (isErr(r)) return err(mapDetailHttpError(r.error)) // 404 → 'budget-plan-not-found'
    const parsed = coreDetailSchema.safeParse(r.value)
    if (!parsed.success) return err('unexpected')
    return ok({
      id: parsed.data.id,
      year: parsed.data.year,
      status: parsed.data.status,
      version: parsed.data.version,
      programName: parsed.data.programName,
      totalInCents: parsed.data.totalInCents,
      // #394: orçamentos por rede (chave natural) — insumo da visão "Por Rede".
      budgets: parsed.data.budgets.map((b) => ({
        budgetId: b.id,
        partnerKind: b.partner.kind,
        partnerRef: b.partner.ref,
        valueInCents: b.valueInCents,
      })),
    })
  },
  getCostStructure: async (
    id: string,
    token: string,
  ): Promise<Result<CostStructureInput, BudgetPlansError>> => {
    const r = await resultFetch<unknown>(`${baseUrl}/${id}/cost-structure`, { token })
    if (isErr(r)) return err(mapDetailHttpError(r.error))
    const parsed = coreCostStructureSchema.safeParse(r.value)
    if (!parsed.success) return err('unexpected')
    return ok({
      costCenters: parsed.data.costCenters.map((cc) => ({
        id: cc.id, // UUID → `ref` no PlanDetail (insumo dos POSTs-filho, feature 061)
        name: cc.name,
        direction: cc.direction,
        categories: cc.categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          subcategories: cat.subcategories.map((sub) => ({
            id: sub.id,
            name: sub.name,
            launchType: sub.launchType,
          })),
        })),
      })),
    })
  },
  createBudgetPlan: async (
    command: CreateBudgetPlanCommand,
    token: string,
  ): Promise<Result<CreatedBudgetPlan, BudgetPlansError>> => {
    const r = await resultFetch<unknown>(baseUrl, {
      method: 'POST',
      token,
      body: { year: command.year, programRef: command.programRef },
    })
    if (isErr(r)) return err(mapCreateHttpError(r.error))
    const parsed = coreCreateResponseSchema.safeParse(r.value)
    if (!parsed.success) return err('unexpected')
    return ok({
      id: parsed.data.id,
      year: parsed.data.year,
      programRef: parsed.data.programRef,
      status: parsed.data.status,
      version: parsed.data.version,
      totalInCents: parsed.data.totalInCents,
    })
  },
  approvePlan: async (id: string, token: string): Promise<Result<LifecyclePlan, BudgetPlansError>> => {
    const r = await resultFetch<unknown>(`${baseUrl}/${id}/approve`, { method: 'POST', token })
    if (isErr(r)) return err(mapApproveHttpError(r.error))
    const parsed = coreLifecyclePlanSchema.safeParse(r.value)
    if (!parsed.success) return err('unexpected')
    return ok({
      id: parsed.data.id,
      year: parsed.data.year,
      status: parsed.data.status,
      version: parsed.data.version,
      totalInCents: parsed.data.totalInCents,
    })
  },
  startCalibration: async (id: string, token: string): Promise<Result<LifecyclePlan, BudgetPlansError>> => {
    const r = await resultFetch<unknown>(`${baseUrl}/${id}/start-calibration`, { method: 'POST', token })
    if (isErr(r)) return err(mapCalibrationHttpError(r.error))
    const parsed = coreLifecyclePlanSchema.safeParse(r.value)
    if (!parsed.success) return err('unexpected')
    return ok({
      id: parsed.data.id,
      year: parsed.data.year,
      status: parsed.data.status,
      version: parsed.data.version,
      totalInCents: parsed.data.totalInCents,
    })
  },
  createScenery: async (
    command: CreateSceneryCommand,
    token: string,
  ): Promise<Result<CreatedScenery, BudgetPlansError>> => {
    const r = await resultFetch<unknown>(`${baseUrl}/${command.id}/scenery`, {
      method: 'POST',
      token,
      body: { name: command.name },
    })
    if (isErr(r)) return err(mapSceneryHttpError(r.error))
    const parsed = coreScenerySchema.safeParse(r.value)
    if (!parsed.success) return err('unexpected')
    return ok({
      id: parsed.data.id,
      name: parsed.data.name,
      status: parsed.data.status,
      version: parsed.data.version,
    })
  },
  // `GET /:id/generate-csv` responde text/csv (NÃO JSON) → `resultFetchText` (sem JSON.parse). O use-case nomeia.
  generateCsv: async (id: string, token: string): Promise<Result<string, BudgetPlansError>> => {
    const r = await resultFetchText(`${baseUrl}/${id}/generate-csv`, { token })
    if (isErr(r)) return err(mapDetailHttpError(r.error))
    return ok(r.value)
  },
  getInsights: async (id: string, token: string): Promise<Result<BudgetPlanInsights, BudgetPlansError>> => {
    const r = await resultFetch<unknown>(`${baseUrl}/${id}/insights`, { token })
    if (isErr(r)) return err(mapDetailHttpError(r.error))
    const parsed = coreInsightsSchema.safeParse(r.value)
    if (!parsed.success) return err('unexpected')
    return ok({
      current: { year: parsed.data.current.year, totalInCents: parsed.data.current.totalInCents },
      previousYears: parsed.data.previousYears.map((y) => ({ year: y.year, totalInCents: y.totalInCents })),
    })
  },
  // ── Escrita da estrutura de custo (feature 061). Cada POST devolve a ÁRVORE INTEIRA atualizada
  // (`coreCostStructureSchema` = a mesma do GET). Anti-corrupção: valida antes de mapear `id`→`ref`. ──
  addCostCenter: async (
    command: AddCostCenterCommand,
    token: string,
  ): Promise<Result<CostStructureTree, BudgetPlansError>> => {
    const r = await resultFetch<unknown>(`${baseUrl}/${command.planId}/cost-structure/cost-centers`, {
      method: 'POST',
      token,
      body: { name: command.name, direction: command.direction },
    })
    if (isErr(r)) return err(mapWriteHttpError(r.error))
    const parsed = coreCostStructureSchema.safeParse(r.value)
    if (!parsed.success) return err('unexpected')
    return ok(toCostStructureTree(parsed.data))
  },
  addCategory: async (
    command: AddCategoryCommand,
    token: string,
  ): Promise<Result<CostStructureTree, BudgetPlansError>> => {
    const r = await resultFetch<unknown>(`${baseUrl}/${command.planId}/cost-structure/categories`, {
      method: 'POST',
      token,
      body: { costCenterId: command.costCenterId, name: command.name },
    })
    if (isErr(r)) return err(mapWriteHttpError(r.error))
    const parsed = coreCostStructureSchema.safeParse(r.value)
    if (!parsed.success) return err('unexpected')
    return ok(toCostStructureTree(parsed.data))
  },
  addSubcategory: async (
    command: AddSubcategoryCommand,
    token: string,
  ): Promise<Result<CostStructureTree, BudgetPlansError>> => {
    const r = await resultFetch<unknown>(`${baseUrl}/${command.planId}/cost-structure/subcategories`, {
      method: 'POST',
      token,
      body: { categoryId: command.categoryId, name: command.name, launchType: command.launchType },
    })
    if (isErr(r)) return err(mapWriteHttpError(r.error))
    const parsed = coreCostStructureSchema.safeParse(r.value)
    if (!parsed.success) return err('unexpected')
    return ok(toCostStructureTree(parsed.data))
  },
  // ── Consolidado ABC (relatório, feature 062). `year` obrigatório; `programRef` opcional. Relatório read-only
  // sem 404 de negócio (ano sem planos → resultado vazio): 401 = sessão; o resto colapsa em `unexpected`. ──
  getConsolidatedResult: async (
    params: ConsolidatedResultParams,
    token: string,
  ): Promise<Result<ConsolidatedAbc, BudgetPlansError>> => {
    const r = await resultFetch<unknown>(`${baseUrl}/consolidated-result?${buildConsolidatedQuery(params)}`, {
      token,
    })
    if (isErr(r)) return err(mapHttpError(r.error))
    const parsed = parseConsolidatedResult(r.value)
    return parsed === null ? err('unexpected') : ok(parsed)
  },
  // `/consolidated-result/csv` responde text/csv (NÃO JSON) → `resultFetchText` (sem JSON.parse). O use-case nomeia.
  getConsolidatedResultCsv: async (
    params: ConsolidatedResultParams,
    token: string,
  ): Promise<Result<string, BudgetPlansError>> => {
    const r = await resultFetchText(`${baseUrl}/consolidated-result/csv?${buildConsolidatedQuery(params)}`, {
      token,
    })
    if (isErr(r)) return err(mapHttpError(r.error))
    return ok(r.value)
  },
})
