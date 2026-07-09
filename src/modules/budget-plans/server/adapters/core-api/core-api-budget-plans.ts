/**
 * Cliente HTTP do core-api para o Plano Orçamentário — implementa o PORT `BudgetPlansCoreClient` (application).
 * Chama `/api/v2/budget-plans` (lista), `/options` (abreviação) e `/:id` (budgets → INTERINO de
 * partnersCount/networkKind, core-api#372). NUNCA lança (tudo é Result; `throw` só na borda do `resultFetch`).
 * Anti-corrupção: Zod valida a resposta e o mapeamento DTO→cru mora aqui (o use-case não conhece o DTO do core).
 */
import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import { resultFetch } from '#external/core-api/result-fetch.ts'
import type { HttpError } from '#shared/http/http-error.types.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'
import type { ListBudgetPlansParams } from '#modules/budget-plans/server/domain/planejamento-list.io.ts'
import type {
  BudgetPlansCoreClient,
  RawPlanListPage,
  RawProgramOption,
  RawPlanBudgets,
} from '#modules/budget-plans/server/application/list-budget-plans.use-case.ts'
import { coreListResponseSchema, coreOptionsSchema, coreDetailSchema } from './budget-plans.schema.ts'

// Transporte → erro de domínio (§V): 401 = sessão; o resto colapsa em `unexpected` (a UI só vê a tag).
const mapHttpError = (e: HttpError): BudgetPlansError =>
  e.kind === 'http' && e.status === 401 ? 'unauthorized' : 'unexpected'

const buildListQuery = (p: ListBudgetPlansParams): string => {
  const q = new URLSearchParams()
  q.set('page', String(p.page))
  q.set('limit', String(p.limit))
  if (p.year !== undefined) q.set('year', String(p.year))
  if (p.status !== undefined) q.set('status', p.status)
  return q.toString()
}

export const createBudgetPlansCoreClient = (baseUrl: string): BudgetPlansCoreClient => ({
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
  getPlanBudgets: async (id, token): Promise<Result<RawPlanBudgets, BudgetPlansError>> => {
    const r = await resultFetch<unknown>(`${baseUrl}/${id}`, { token })
    if (isErr(r)) return err(mapHttpError(r.error))
    const parsed = coreDetailSchema.safeParse(r.value)
    if (!parsed.success) return err('unexpected')
    return ok({ budgets: parsed.data.budgets.map((b) => ({ partnerKind: b.partner.kind })) })
  },
})
