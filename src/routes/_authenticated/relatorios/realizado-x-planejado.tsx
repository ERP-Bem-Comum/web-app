/**
 * Rota /relatorios/realizado-x-planejado — relatório "Realizado × Planejado" (Relatórios), protegida.
 * Front-first: a page usa dados placeholder até o endpoint do core-api (#114) existir. Sem RBAC (o relatório
 * não tem `requiredPermission`). O módulo expõe a page pela public-api (ADR-0004).
 */
import { createFileRoute } from '@tanstack/react-router'

import { RealizadoXPlanejadoPage } from '#modules/reports/public-api/index.ts'

export const Route = createFileRoute('/_authenticated/relatorios/realizado-x-planejado')({
  component: RealizadoXPlanejadoPage,
})
