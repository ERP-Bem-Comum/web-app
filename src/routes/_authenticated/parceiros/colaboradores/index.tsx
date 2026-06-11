/**
 * Rota /parceiros/colaboradores — listagem de Colaboradores (protegida). Filtros nos search params.
 */
import { createFileRoute } from '@tanstack/react-router'

import { CollaboratorListFiltersSchema } from '#modules/partners/client/data/collaborator-list-filters.schema.ts'
import { CollaboratorListPage } from '#modules/partners/client/collaborator-list/page/collaborator-list.page.tsx'

export const Route = createFileRoute('/_authenticated/parceiros/colaboradores/')({
  validateSearch: CollaboratorListFiltersSchema,
  component: CollaboratorListPage,
})
