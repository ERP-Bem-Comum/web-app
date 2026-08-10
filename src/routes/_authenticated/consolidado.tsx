/**
 * Rota /consolidado — Consolidado ABC (Plano Orçamentário), protegida. Filtros Ano Base + Programa (uuid
 * opcional) nos search params (HANDBOOK §2). Lê o consolidado REAL do core-api
 * (`GET /budget-plans/consolidated-result`, feature 062).
 */
import { createFileRoute } from '@tanstack/react-router'

import { ConsolidadoAbcFiltersSchema } from '#modules/budget-plans/client/data/consolidado-abc-filters.schema.ts'
import { ConsolidadoAbcPage } from '#modules/budget-plans/client/planejamento/consolidado/page/consolidado-abc.page.tsx'

export const Route = createFileRoute('/_authenticated/consolidado')({
  validateSearch: ConsolidadoAbcFiltersSchema,
  component: ConsolidadoAbcPage,
})
