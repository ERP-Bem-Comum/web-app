/**
 * Rota /parceiros/atos — listagem de ACTs (protegida). Filtros nos search params.
 */
import { createFileRoute } from '@tanstack/react-router'

import { ActListFiltersSchema } from '#modules/partners/client/data/act-list-filters.schema.ts'
import { ActListPage } from '#modules/partners/client/act-list/page/act-list.page.tsx'

export const Route = createFileRoute('/_authenticated/parceiros/atos/')({
  validateSearch: ActListFiltersSchema,
  component: ActListPage,
})
