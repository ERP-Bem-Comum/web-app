/**
 * Rota /parceiros/fornecedores/$id — detalhe de fornecedor + ações de status (US3).
 */
import { createFileRoute } from '@tanstack/react-router'

import { SupplierDetailPage } from '#modules/partners/client/supplier-detail/page/supplier-detail.page.tsx'

export const Route = createFileRoute('/_authenticated/parceiros/fornecedores/$id')({
  component: SupplierDetailPage,
})
