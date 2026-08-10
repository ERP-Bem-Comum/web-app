/**
 * Rota /relatorios/posicao-recebimentos — relatório "Posição de Recebimentos" (Relatórios), protegida.
 * Espelha /relatorios/posicao-pagamentos: front-first com dados placeholder SINTÉTICOS (empty-state-ready)
 * até o Contas a Receber (core-api#114) existir. Sem RBAC (`requiredPermission` ausente — modelado pós-entrega).
 * O módulo expõe a page pela public-api (ADR-0004).
 */
import { createFileRoute } from '@tanstack/react-router'

import { PosicaoRecebimentosPage } from '#modules/reports/public-api/index.ts'

export const Route = createFileRoute('/_authenticated/relatorios/posicao-recebimentos')({
  component: PosicaoRecebimentosPage,
})
