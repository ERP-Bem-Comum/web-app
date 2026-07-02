/**
 * Rota /consolidado — Consolidado ABC (Plano Orçamentário), protegida. Filtros Ano Base + Programa(s) nos
 * search params (HANDBOOK §2). Front-first: a page usa dados placeholder até o endpoint
 * `GET /budget-plans/consolidated-result` existir (core-api #113).
 */
import { createFileRoute } from '@tanstack/react-router'

import { ConsolidadoAbcFiltersSchema } from '#modules/budget-plans/client/data/consolidado-abc-filters.schema.ts'
import { ConsolidadoAbcPage } from '#modules/budget-plans/client/planejamento/consolidado/page/consolidado-abc.page.tsx'

export const Route = createFileRoute('/_authenticated/consolidado')({
  validateSearch: ConsolidadoAbcFiltersSchema,
  component: ConsolidadoAbcPage,
})
