/**
 * Use-case: INICIAR CALIBRAÇÃO de um Plano Orçamentário (`POST /:id/start-calibration` — §III). Sem body;
 * resposta = plano atualizado. Erros como valores (§II): 409 → `budget-plan-not-approved` (calibração só em
 * plano APROVADO). O PORT vive aqui (application); o adapter o implementa (§ server).
 */
import type { Result } from '#shared/primitives/result.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'
import type { LifecyclePlan } from '#modules/budget-plans/server/domain/plan-actions.io.ts'

export type StartCalibrationClient = Readonly<{
  startCalibration: (id: string, token: string) => Promise<Result<LifecyclePlan, BudgetPlansError>>
}>

export type StartCalibrationDeps = Readonly<{ client: StartCalibrationClient }>

export const createStartCalibration =
  (deps: StartCalibrationDeps) =>
  (id: string, token: string): Promise<Result<LifecyclePlan, BudgetPlansError>> =>
    deps.client.startCalibration(id, token)
