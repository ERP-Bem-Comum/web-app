/**
 * Rota /planejamento — lista do submódulo Planejamento (Plano Orçamentário), protegida. Filtros do funil
 * (Ano/Programa/Status) + busca + paginação nos search params. Front-first: a page usa dados placeholder
 * até o endpoint `GET /budget-plans` existir (core-api #113).
 */
import { createFileRoute } from '@tanstack/react-router'

import { PlanejamentoListFiltersSchema } from '#modules/budget-plans/client/data/planejamento-list-filters.schema.ts'
import { PlanejamentoListPage } from '#modules/budget-plans/client/planejamento/page/planejamento-list.page.tsx'

export const Route = createFileRoute('/_authenticated/planejamento')({
  validateSearch: PlanejamentoListFiltersSchema,
  component: PlanejamentoListPage,
})
