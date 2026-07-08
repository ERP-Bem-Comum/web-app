/**
 * Rota /relatorios/fluxo-caixa — relatório "Fluxo de Caixa" (Relatórios), protegida. Front-first: a page usa
 * dados placeholder SINTÉTICOS até o endpoint do core-api (#114) existir. Sem RBAC (o relatório não tem
 * `requiredPermission` — o RBAC é modelado pelo cliente pós-entrega). O módulo expõe a page pela public-api
 * (ADR-0004). Espelho do relatório legado de fluxo de caixa (Saídas × Entradas × Saldo).
 */
import { createFileRoute } from '@tanstack/react-router'

import { FluxoCaixaPage } from '#modules/reports/public-api/index.ts'

export const Route = createFileRoute('/_authenticated/relatorios/fluxo-caixa')({
  component: FluxoCaixaPage,
})
