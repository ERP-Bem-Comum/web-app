/**
 * Query options do "Minha Conta" — AGNÓSTICO (puro). Sobre o repository (GET /me).
 */
import { usersRepository } from '#modules/users/client/data/repository/users.repository.instance.ts'

export const myAccountQueryKey = ['users', 'me'] as const

export const myAccountQueryOptions = {
  queryKey: myAccountQueryKey,
  queryFn: () => usersRepository.getMe(),
}
