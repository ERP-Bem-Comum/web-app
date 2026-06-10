/**
 * Query options do detalhe de Usuário — AGNÓSTICO (puro). Sobre o repository. Espelha
 * `act-detail.query.ts`.
 */
import { usersRepository } from '#modules/users/client/data/repository/users.repository.instance.ts'

export const userDetailQueryKey = (id: string) => ['users', 'detail', id] as const

export const userDetailQueryOptions = (id: string) => ({
  queryKey: userDetailQueryKey(id),
  queryFn: () => usersRepository.getById(id),
})
