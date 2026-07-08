/**
 * Rota /relatorios/analise-recebimentos — relatório "Análise de Recebimentos" (Relatórios), protegida.
 * Espelha /relatorios/analise-pagamentos: front-first com dados placeholder SINTÉTICOS (empty-state-ready) até
 * o Contas a Receber (core-api#114/consolidated) existir. Sem RBAC (`requiredPermission` ausente — modelado
 * pós-entrega). O módulo expõe a page pela public-api (ADR-0004).
 */
import { createFileRoute } from '@tanstack/react-router'

import { AnaliseRecebimentosPage } from '#modules/reports/public-api/index.ts'

export const Route = createFileRoute('/_authenticated/relatorios/analise-recebimentos')({
  component: AnaliseRecebimentosPage,
})
