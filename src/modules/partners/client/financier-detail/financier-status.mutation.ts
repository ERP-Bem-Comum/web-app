/**
 * Mutation de mudança de status (inativar/reativar) — AGNÓSTICO (puro). Idempotente no backend.
 */
import { financierRepository } from '#modules/partners/client/data/repository/financier.repository.instance.ts'
import type { StatusAction } from '#modules/partners/client/domain/financier.types.ts'

export const financierStatusMutationKey = ['financiers', 'status'] as const

export const financierStatusMutationOptions = {
  mutationKey: financierStatusMutationKey,
  mutationFn: (vars: Readonly<{ id: string; action: StatusAction }>) =>
    vars.action === 'deactivate'
      ? financierRepository.deactivate(vars.id)
      : financierRepository.reactivate(vars.id),
}
