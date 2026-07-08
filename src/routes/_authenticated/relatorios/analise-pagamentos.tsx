/**
 * Rota /relatorios/analise-pagamentos — relatório "Análise de Pagamentos" (Relatórios), protegida. Front-first:
 * a page usa dados placeholder até o endpoint do core-api (#114/consolidated) existir. Sem RBAC (o relatório
 * não tem `requiredPermission`). O módulo expõe a page pela public-api (ADR-0004).
 */
import { createFileRoute } from '@tanstack/react-router'

import { AnalisePagamentosPage } from '#modules/reports/public-api/index.ts'

export const Route = createFileRoute('/_authenticated/relatorios/analise-pagamentos')({
  component: AnalisePagamentosPage,
})
