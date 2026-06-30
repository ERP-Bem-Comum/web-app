/**
 * Mutation de edição de Usuário (inline no detalhe) — AGNÓSTICO (puro). PUT total (4 campos + id).
 */
import { usersRepository } from '#modules/users/client/data/repository/users.repository.instance.ts'
import type { UpdateUserInput } from '#modules/users/client/data/model/user.model.ts'

export const usersUpdateMutationKey = ['users', 'update'] as const

export const usersUpdateMutationOptions = {
  mutationKey: usersUpdateMutationKey,
  mutationFn: (input: UpdateUserInput & Readonly<{ id: string }>) => usersRepository.update(input),
}
