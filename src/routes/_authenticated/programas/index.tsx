/**
 * Rota /programas — listagem de Programas (protegida). Filtros nos search params.
 */
import { createFileRoute } from '@tanstack/react-router'

import { ProgramsListFiltersSchema } from '#modules/programs/client/data/programs-list-filters.schema.ts'
import { ProgramsListPage } from '#modules/programs/client/program-list/page/programs-list.page.tsx'

export const Route = createFileRoute('/_authenticated/programas/')({
  validateSearch: ProgramsListFiltersSchema,
  component: ProgramsListPage,
})
