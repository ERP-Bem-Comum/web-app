/**
 * ViewModel da criação de Usuário — AGNÓSTICO (puro). Mutation options + mapeamento de erro → tag i18n.
 * Espelha `act-create.view-model.ts`.
 */
import { usersErrorTag } from '#modules/users/client/data/helpers/users-error-tag.ts'
import type { UsersError } from '#modules/users/client/data/repository/users-error.ts'

import { usersCreateMutationOptions } from './users-create.mutation.ts'

export const usersCreateViewModel = {
  mutation: usersCreateMutationOptions,
  toErrorTag: (error: UsersError): string => usersErrorTag(error),
  unexpectedErrorTag: 'users.error.server',
}
