/**
 * Mutation de ativação (desativar/reativar) de Usuário — AGNÓSTICO (puro). Idempotente no backend
 * (PATCH activate/deactivate). Espelha `act-status.mutation.ts`.
 */
import { usersRepository } from '#modules/users/client/data/repository/users.repository.instance.ts'
import type { StatusAction } from '#modules/users/client/domain/user.types.ts'

export const usersStatusMutationKey = ['users', 'status'] as const

export const usersStatusMutationOptions = {
  mutationKey: usersStatusMutationKey,
  mutationFn: (vars: Readonly<{ id: string; action: StatusAction }>) =>
    usersRepository.setActive(vars.id, vars.action === 'reactivate'),
}
