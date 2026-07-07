/**
 * Rota /relatorios/posicao-pagamentos — relatório "Posição de Pagamentos" (Relatórios), protegida.
 * Front-first: a page usa dados placeholder SINTÉTICOS até o endpoint do core-api (#114) existir. Sem RBAC (o
 * relatório não tem `requiredPermission` — o RBAC é modelado pelo cliente pós-entrega). O módulo expõe a page
 * pela public-api (ADR-0004). É a implementação de referência da "engine de Posição" (reusável p/ Recebíveis).
 */
import { createFileRoute } from '@tanstack/react-router'

import { PosicaoPagamentosPage } from '#modules/reports/public-api/index.ts'

export const Route = createFileRoute('/_authenticated/relatorios/posicao-pagamentos')({
  component: PosicaoPagamentosPage,
})
