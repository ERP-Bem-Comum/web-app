/**
 * Rota /parceiros/fornecedores/criar — cadastro de fornecedor (US2).
 */
import { createFileRoute } from '@tanstack/react-router'

import { SupplierCreatePage } from '#modules/partners/client/supplier-create/page/supplier-create.page.tsx'

export const Route = createFileRoute('/_authenticated/parceiros/fornecedores/criar')({
  component: SupplierCreatePage,
})
