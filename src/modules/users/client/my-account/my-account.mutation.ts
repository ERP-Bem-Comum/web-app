/**
 * Mutation options do "Minha Conta" — AGNÓSTICO (puro). Editar perfil (PUT /me) + trocar senha
 * (POST /auth/change-password).
 */
import { usersRepository } from '#modules/users/client/data/repository/users.repository.instance.ts'
import type { UpdateMeInput, ChangePasswordInput } from '#modules/users/client/data/model/user.model.ts'

export const updateMeMutationKey = ['users', 'me', 'update'] as const
export const updateMeMutationOptions = {
  mutationKey: updateMeMutationKey,
  mutationFn: (input: UpdateMeInput) => usersRepository.updateMe(input),
}

export const changePasswordMutationKey = ['users', 'me', 'password'] as const
export const changePasswordMutationOptions = {
  mutationKey: changePasswordMutationKey,
  mutationFn: (input: ChangePasswordInput) => usersRepository.changePassword(input),
}
