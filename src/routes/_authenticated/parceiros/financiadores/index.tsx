/**
 * Rota /parceiros/financiadores — listagem de financiadores (protegida). Filtros nos search params.
 */
import { createFileRoute } from '@tanstack/react-router'

import { FinancierListFiltersSchema } from '#modules/partners/client/data/financier-list-filters.schema.ts'
import { FinancierListPage } from '#modules/partners/client/financier-list/page/financier-list.page.tsx'

export const Route = createFileRoute('/_authenticated/parceiros/financiadores/')({
  validateSearch: FinancierListFiltersSchema,
  component: FinancierListPage,
})
