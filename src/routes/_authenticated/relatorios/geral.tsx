/**
 * Rota /relatorios/geral — "Relatório Geral" (Relatórios), protegida. Front-first: a page usa dados placeholder
 * SINTÉTICOS até o endpoint do core-api (#114) existir. Sem RBAC (o relatório não tem `requiredPermission` — o
 * RBAC é modelado pelo cliente pós-entrega). O módulo expõe a page pela public-api (ADR-0004). Espelho do
 * relatório legado de ledger unificado achatado e paginado.
 */
import { createFileRoute } from '@tanstack/react-router'

import { RelatorioGeralPage } from '#modules/reports/public-api/index.ts'

export const Route = createFileRoute('/_authenticated/relatorios/geral')({
  component: RelatorioGeralPage,
})
