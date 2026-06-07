/**
 * Mutation de mudança de ATIVAÇÃO (inativar/reativar) — AGNÓSTICO (puro). Idempotente no backend.
 * (O status cadastral `registration` é somente-leitura nesta fase.)
 */
import { actRepository } from '#modules/partners/client/data/repository/act.repository.instance.ts'
import type { StatusAction } from '#modules/partners/client/domain/act.types.ts'

export const actStatusMutationKey = ['acts', 'status'] as const

export const actStatusMutationOptions = {
  mutationKey: actStatusMutationKey,
  mutationFn: (vars: Readonly<{ id: string; action: StatusAction }>) =>
    vars.action === 'deactivate' ? actRepository.deactivate(vars.id) : actRepository.reactivate(vars.id),
}
