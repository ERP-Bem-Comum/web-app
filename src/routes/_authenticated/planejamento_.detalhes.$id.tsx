/**
 * Rota /planejamento/detalhes/$id — Detalhe do plano orçamentário (consolidado por mês). Protegida.
 * Front-first: a page usa dados placeholder até `GET /budget-plans/:id` existir (core-api #113).
 */
import { createFileRoute } from '@tanstack/react-router'

import { PlanDetailPage } from '#modules/budget-plans/client/planejamento/detalhe/page/plan-detail.page.tsx'

export const Route = createFileRoute('/_authenticated/planejamento_/detalhes/$id')({
  component: PlanDetailPage,
})
