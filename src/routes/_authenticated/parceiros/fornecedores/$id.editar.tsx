/**
 * Rota /parceiros/fornecedores/$id/editar — edição de fornecedor (US4).
 */
import { createFileRoute } from '@tanstack/react-router'

import { SupplierEditPage } from '#modules/partners/client/supplier-edit/page/supplier-edit.page.tsx'

export const Route = createFileRoute('/_authenticated/parceiros/fornecedores/$id/editar')({
  component: SupplierEditPage,
})
