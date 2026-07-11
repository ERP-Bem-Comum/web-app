/**
 * Use-case: compor o DETALHE do Plano Orçamentário a partir do core-api novo (§III: o BFF orquestra; o client
 * não compõe). Costura 2 leituras numa fn:
 *   1. cabeçalho (`GET /budget-plans/:id`)        → header cru (id, year, status, version, programName, total).
 *   2. estrutura de custo (`GET /:id/cost-structure`) → árvore crua (só nomes/estrutura, SEM valores).
 * Depois chama o mapper PURO `mapPlanDetail` (domínio) para entregar o `PlanDetailComposed` pronto.
 *
 * Dependência aponta para dentro (§ server): o PORT (`GetBudgetPlanDetailClient`) vive AQUI (application); o
 * adapter o implementa e mapeia o DTO do core. Os tipos CRUS são de domínio (insumo do mapper) — a application
 * os reexporta pelo port. O use-case não conhece o schema do core.
 *
 * cost-structure é CORE (não best-effort): se falhar, PROPAGA o erro (não degrada p/ árvore vazia). Árvore
 * vazia legítima só via 200 `{ costCenters: [] }`. Erros como valores (§II): 404 do cabeçalho já chega como
 * `budget-plan-not-found`.
 */
import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'
import type {
  CostStructureInput,
  PlanDetailComposed,
  PlanDetailHeaderInput,
  BudgetResultRow,
} from '#modules/budget-plans/server/domain/plan-detail.io.ts'
import { mapPlanDetail, fillNetworkCells } from '#modules/budget-plans/server/domain/plan-detail.mapper.ts'

// ── Port (application) — o adapter implementa. Entrega os tipos CRUS de domínio (insumo do mapper). ──
export type GetBudgetPlanDetailClient = Readonly<{
  getPlanDetailHeader: (id: string, token: string) => Promise<Result<PlanDetailHeaderInput, BudgetPlansError>>
  getCostStructure: (id: string, token: string) => Promise<Result<CostStructureInput, BudgetPlansError>>
  // #C2: resultados de cálculo de UMA rede (budget) → { subcategoryRef → valueInCents }.
  getBudgetResults: (
    budgetId: string,
    token: string,
  ) => Promise<Result<readonly BudgetResultRow[], BudgetPlansError>>
}>

export type GetBudgetPlanDetailDeps = Readonly<{ client: GetBudgetPlanDetailClient }>

export const createGetBudgetPlanDetail =
  (deps: GetBudgetPlanDetailDeps) =>
  async (id: string, token: string): Promise<Result<PlanDetailComposed, BudgetPlansError>> => {
    const headerRes = await deps.client.getPlanDetailHeader(id, token)
    if (isErr(headerRes)) return err(headerRes.error) // 404 já vem como 'budget-plan-not-found'

    const structureRes = await deps.client.getCostStructure(id, token)
    if (isErr(structureRes)) return err(structureRes.error) // CORE: falha propaga (não degrada)

    const detail = mapPlanDetail(headerRes.value, structureRes.value)

    // #C2: acende as células "Por Rede" — fan-out dos resultados de cálculo por rede (best-effort: rede sem
    // resultado ou erro pontual → zeros, não derruba o detalhe). A ordem espelha `detail.networks`.
    if (detail.networks.length === 0) return ok(detail)
    const resultsPerNetwork = await Promise.all(
      detail.networks.map(async (n): Promise<readonly BudgetResultRow[]> => {
        const r = await deps.client.getBudgetResults(n.budgetId, token)
        return isErr(r) ? [] : r.value
      }),
    )
    return ok(fillNetworkCells(detail, resultsPerNetwork))
  }
