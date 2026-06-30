/**
 * Mutation options da criação de Usuário — AGNÓSTICO (puro). Sobre o repository. Espelha
 * `act-create.mutation.ts`.
 */
import { usersRepository } from '#modules/users/client/data/repository/users.repository.instance.ts'
import type { CreateUserInput } from '#modules/users/client/data/model/user.model.ts'

export const usersCreateMutationKey = ['users', 'create'] as const

export const usersCreateMutationOptions = {
  mutationKey: usersCreateMutationKey,
  mutationFn: (input: CreateUserInput) => usersRepository.create(input),
}
