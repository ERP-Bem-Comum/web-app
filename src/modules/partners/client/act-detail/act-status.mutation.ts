/**
 * Mutation de mudança de situação (inativar/reativar) do Acordo — AGNÓSTICO (puro). Idempotente no
 * backend (`POST /acts/:id/deactivate|reactivate` sem body → refetch do detalhe).
 */
import { actRepository } from '#modules/partners/client/data/repository/act.repository.instance.ts'
import type { StatusAction } from '#modules/partners/client/domain/act.types.ts'

export const actStatusMutationKey = ['acts', 'status'] as const

export const actStatusMutationOptions = {
  mutationKey: actStatusMutationKey,
  mutationFn: (vars: Readonly<{ id: string; action: StatusAction }>) =>
    vars.action === 'deactivate' ? actRepository.deactivate(vars.id) : actRepository.reactivate(vars.id),
}
