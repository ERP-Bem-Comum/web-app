/**
 * Query options da listagem de Usuários — AGNÓSTICO (puro, zero React). Sobre o repository.
 */
import { usersRepository } from '#modules/users/client/data/repository/users.repository.instance.ts'
import type { UsersListFilters } from '#modules/users/client/data/users-list-filters.schema.ts'

export const usersListQueryKey = (input: UsersListFilters) => ['users', 'list', input] as const

export const usersListQueryOptions = (input: UsersListFilters) => ({
  queryKey: usersListQueryKey(input),
  queryFn: () => usersRepository.list(input),
})
