/**
 * Rota /usuarios — listagem de Usuários (protegida). Filtros nos search params.
 */
import { createFileRoute } from '@tanstack/react-router'

import { UsersListFiltersSchema } from '#modules/users/client/data/users-list-filters.schema.ts'
import { UsersListPage } from '#modules/users/client/users-list/page/users-list.page.tsx'

export const Route = createFileRoute('/_authenticated/usuarios/')({
  validateSearch: UsersListFiltersSchema,
  component: UsersListPage,
})
