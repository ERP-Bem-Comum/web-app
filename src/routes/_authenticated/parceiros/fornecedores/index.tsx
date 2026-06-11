/**
 * Rota /parceiros/fornecedores — listagem de fornecedores (protegida). Filtros nos search params.
 */
import { createFileRoute } from '@tanstack/react-router'

import { SupplierListFiltersSchema } from '#modules/partners/client/data/supplier-list-filters.schema.ts'
import { SupplierListPage } from '#modules/partners/client/supplier-list/page/supplier-list.page.tsx'

export const Route = createFileRoute('/_authenticated/parceiros/fornecedores/')({
  validateSearch: SupplierListFiltersSchema,
  component: SupplierListPage,
})
