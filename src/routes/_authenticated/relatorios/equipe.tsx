/**
 * Rota /relatorios/equipe — relatório "Equipe ABC" (Relatórios), protegida. Front-first: a page usa dados
 * placeholder SINTÉTICOS/anonimizados (LGPD) até o endpoint do core-api (#114/#112) existir. Sem RBAC (o
 * relatório não tem `requiredPermission` — o RBAC é modelado pelo cliente pós-entrega). O módulo expõe a page
 * pela public-api (ADR-0004).
 */
import { createFileRoute } from '@tanstack/react-router'

import { EquipePage } from '#modules/reports/public-api/index.ts'

export const Route = createFileRoute('/_authenticated/relatorios/equipe')({
  component: EquipePage,
})
