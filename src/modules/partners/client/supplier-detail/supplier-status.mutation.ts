/**
 * Mutation de mudança de status (inativar/reativar) — AGNÓSTICO (puro). Idempotente no backend.
 */
import { supplierRepository } from '#modules/partners/client/data/repository/supplier.repository.instance.ts'
import type { StatusAction } from '#modules/partners/client/domain/supplier.types.ts'

export const supplierStatusMutationKey = ['suppliers', 'status'] as const

export const supplierStatusMutationOptions = {
  mutationKey: supplierStatusMutationKey,
  mutationFn: (vars: Readonly<{ id: string; action: StatusAction }>) =>
    vars.action === 'deactivate'
      ? supplierRepository.deactivate(vars.id)
      : supplierRepository.reactivate(vars.id),
}
